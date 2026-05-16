/**
 * Promotion Engine — Auto-Pro Grant + Weekly Business Lottery
 */
const db = require('../db');
const { applyPlanToUser } = require('./subscriptionService');

// Grant Pro plan to new users (limited time promotion)
async function grantAutoPro(userId) {
    try {
        // Check if user already has a plan
        const existing = await db.query('SELECT subscription_plan FROM users WHERE id = $1', [userId]);
        if (existing.rows[0]?.subscription_plan && existing.rows[0].subscription_plan !== 'free') {
            return { granted: false, reason: 'Already has a plan' };
        }

        // Check if auto-pro campaign is active
        const campaign = await db.query(
            `SELECT * FROM promo_campaigns WHERE type = 'auto_pro' AND is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at >= NOW()) LIMIT 1`
        );

        if (campaign.rows.length === 0) {
            // Create the default auto-pro campaign if it doesn't exist
            await db.query(`
                INSERT INTO promo_campaigns (name, type, plan, description, is_active, starts_at, duration_months, max_claims)
                VALUES ('New User Pro Trial', 'auto_pro', 'pro', 'All new users get Pro free trial!', true, NOW(), 1, 10000)
                ON CONFLICT DO NOTHING
            `);
        }

        // Grant Pro plan for 1 month
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);

        await db.query(
            `INSERT INTO subscriptions (user_id, plan, source, duration_months, expires_at) VALUES ($1, 'pro', 'auto_pro', 1, $2)`,
            [userId, expires]
        );
        await db.query(`UPDATE users SET subscription_plan = 'pro' WHERE id = $1`, [userId]);

        console.log(`🎉 Auto-Pro granted to user ${userId}`);
        return { granted: true, plan: 'pro', expires_at: expires };
    } catch (e) {
        console.log('Auto-Pro grant error:', e.message);
        return { granted: false, reason: e.message };
    }
}

// Run weekly Business lottery — pick 5 random winners
async function runWeeklyLottery() {
    try {
        // Find active weekly lottery campaign
        const campaign = await db.query(
            `SELECT * FROM promo_campaigns WHERE type = 'lottery' AND plan = 'business' AND is_active = true AND starts_at <= NOW() AND ends_at >= NOW() LIMIT 1`
        );

        if (campaign.rows.length === 0) {
            // Create default weekly Business lottery if not exists
            const ends = new Date();
            ends.setFullYear(ends.getFullYear() + 1);
            await db.query(`
                INSERT INTO promo_campaigns (name, type, plan, description, is_active, starts_at, ends_at, max_claims)
                VALUES ('Weekly Business Plan Lottery', 'lottery', 'business', 'Win a free Business plan! 5 winners every week.', true, NOW(), $1, 5)
                ON CONFLICT DO NOTHING
            `, [ends]);
            console.log('📋 Created weekly Business lottery campaign');
            return { winners: 0, message: 'Campaign created — winners will be drawn next week' };
        }

        const c = campaign.rows[0];

        // Get all pending entries for this campaign
        const entries = await db.query(
            `SELECT user_id FROM promo_entries WHERE campaign_id = $1 AND status = 'pending'`,
            [c.id]
        );

        if (entries.rows.length === 0) {
            console.log('📋 No lottery entries to draw');
            return { winners: 0, message: 'No entries' };
        }

        // Pick 5 random winners (or fewer if less entries)
        const winnerCount = Math.min(5, entries.rows.length);
        const shuffled = entries.rows.sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, winnerCount);

        for (const w of winners) {
            const expires = new Date();
            expires.setMonth(expires.getMonth() + 1);

            // Grant Business plan
            await db.query(
                `INSERT INTO subscriptions (user_id, plan, source, duration_months, expires_at, promo_campaign_id) VALUES ($1, 'business', 'lottery', 1, $2, $3)`,
                [w.user_id, expires, c.id]
            );
            await db.query(`UPDATE users SET subscription_plan = 'business' WHERE id = $1`, [w.user_id]);

            // Mark entry as won
            await db.query(
                `UPDATE promo_entries SET status = 'won' WHERE campaign_id = $1 AND user_id = $2`,
                [c.id, w.user_id]
            );

            // Mark remaining as lost
            await db.query(
                `UPDATE promo_entries SET status = 'lost' WHERE campaign_id = $1 AND user_id != ALL($2::uuid[])`,
                [c.id, winners.map(w => w.user_id)]
            );

            // Try to send email
            try {
                const { sendEmail } = require('./emailService');
                const user = await db.query('SELECT email, full_name FROM users WHERE id = $1', [w.user_id]);
                if (user.rows[0]) {
                    await sendEmail(user.rows[0].email, '🎉 You won the Business Plan Lottery!', 'lottery_win', {
                        name: user.rows[0].full_name || 'Seller',
                        plan: 'Business'
                    });
                }
            } catch (e) { console.log('Lottery email (non-critical):', e.message); }
        }

        // Reset campaign for next week
        await db.query(`UPDATE promo_campaigns SET starts_at = NOW(), ends_at = NOW() + INTERVAL '7 days', current_claims = $1 WHERE id = $2`, [c.current_claims + winnerCount, c.id]);

        console.log(`🎰 Weekly lottery: ${winnerCount} winners drawn from ${entries.rows.length} entries`);
        return { winners: winnerCount, totalEntries: entries.rows.length };
    } catch (e) {
        console.log('Weekly lottery error:', e.message);
        return { winners: 0, error: e.message };
    }
}

module.exports = { grantAutoPro, runWeeklyLottery };
