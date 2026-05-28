const db = require('../db');
const crypto = require('crypto');

// Generate unique referral code
function generateReferralCode(userId) {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return hash.substring(0, 8).toUpperCase();
}

// Track referral when user signs up
async function trackReferral(newUserId, referralCode) {
    try {
        // Find referrer by code
        const referrer = await db.query(
            'SELECT id FROM users WHERE referral_code = $1',
            [referralCode.toUpperCase()]
        );
        
        if (referrer.rows.length === 0) return null;
        const referrerId = referrer.rows[0].id;
        
        // Don't allow self-referral
        if (referrerId === newUserId) return null;
        
        // Check if already referred
        const existing = await db.query(
            'SELECT id FROM referrals WHERE referred_user_id = $1',
            [newUserId]
        );
        if (existing.rows.length > 0) return null;
        
        // Create referral record
        const result = await db.query(`
            INSERT INTO referrals (referrer_id, referred_user_id, referral_code_used, status)
            VALUES ($1, $2, $3, 'active')
            RETURNING *
        `, [referrerId, newUserId, referralCode]);
        
        // Update referrer's total referrals
        await db.query(
            'UPDATE users SET total_referrals = total_referrals + 1 WHERE id = $1',
            [referrerId]
        );
        
        // Update referred_by on user
        await db.query(
            'UPDATE users SET referred_by = $1 WHERE id = $2',
            [referrerId, newUserId]
        );
        
        // Mark any referral visits as converted
        await db.query(
            'UPDATE referral_visits SET converted_user_id = $1, converted_at = NOW() WHERE referrer_id = $2 AND referral_code = $3 AND converted_user_id IS NULL',
            [newUserId, referrerId, referralCode]
        );
        
        // Get commission settings
        const settings = await db.query(
            'SELECT setting_value FROM affiliate_settings WHERE setting_key = $1',
            ['commission_structure']
        );
        const commissionSettings = settings.rows[0]?.setting_value || {};
        
        // Award signup bonus to REFERRER if configured
        if (commissionSettings.signup_bonus > 0) {
            await awardCommission(
                referrerId, newUserId, null,
                commissionSettings.signup_bonus * 100, 0, 'signup'
            );
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Track referral error:', error);
        return null;
    }
}

// Award commission for a purchase
async function awardCommission(referrerId, referredUserId, purchaseId, amountCents, commissionRate, commissionType) {
    const commissionCents = Math.round(amountCents * commissionRate / 100);
    
    await db.query('BEGIN');
    
    // Create commission record
    await db.query(`
        INSERT INTO affiliate_commissions 
        (referrer_id, referred_user_id, purchase_id, amount_cents, commission_rate, commission_cents, commission_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    `, [referrerId, referredUserId, purchaseId, amountCents, commissionRate, commissionCents, commissionType]);
    
    // Update affiliate balance
    await db.query(
        'UPDATE users SET affiliate_balance_cents = affiliate_balance_cents + $1, total_affiliate_earned_cents = total_affiliate_earned_cents + $1 WHERE id = $2',
        [commissionCents, referrerId]
    );
    
    await db.query('COMMIT');
    
    return commissionCents;
}

// Process commission when referred user makes purchase
async function processReferralPurchase(userId, purchaseId, amountCents, purchaseType) {
    try {
        // Check if user was referred
        const user = await db.query(
            'SELECT referred_by FROM users WHERE id = $1 AND referred_by IS NOT NULL',
            [userId]
        );
        if (user.rows.length === 0) return null;
        
        const referrerId = user.rows[0].referred_by;
        
        // Get commission settings
        const settings = await db.query(
            'SELECT setting_value FROM affiliate_settings WHERE setting_key = $1',
            ['commission_structure']
        );
        const commissionSettings = settings.rows[0]?.setting_value || {};
        
        // Check if this is first purchase
        const purchaseCount = await db.query(
            'SELECT COUNT(*) FROM purchases WHERE buyer_id = $1',
            [userId]
        );
        const isFirstPurchase = parseInt(purchaseCount.rows[0].count) === 1;
        
        // Determine commission rate
        let commissionRate = 0;
        let commissionType = '';
        
        if (purchaseType === 'buyer') {
            if (isFirstPurchase) {
                commissionRate = commissionSettings.first_purchase_rate || 5.0;
                commissionType = 'first_purchase';
            } else {
                commissionRate = commissionSettings.ongoing_purchase_rate || 2.0;
                commissionType = 'ongoing';
            }
        } else if (purchaseType === 'seller') {
            commissionRate = commissionSettings.seller_sale_rate || 1.0;
            commissionType = 'seller_sale';
        }
        
        if (commissionRate > 0) {
            return await awardCommission(
                referrerId, userId, purchaseId, amountCents, commissionRate, commissionType
            );
        }
        
        return null;
    } catch (error) {
        console.error('Process referral purchase error:', error);
        return null;
    }
}

// Get affiliate dashboard data
async function getAffiliateDashboard(userId) {
    try {
        const user = await db.query(
            "SELECT referral_code, affiliate_balance_cents, total_referrals, total_affiliate_earned_cents FROM users WHERE id = $1",
            [userId]
        );
        if (user.rows.length === 0) return null;
        const u = user.rows[0];
        let code = u.referral_code;
        if (!code) {
            code = generateReferralCode(userId);
            await db.query("UPDATE users SET referral_code = $1 WHERE id = $2", [code, userId]);
        }
        let referrals = { rows: [] };
        try {
            referrals = await db.query(`SELECT r.*, u.email, u.full_name, u.created_at as joined_at FROM referrals r JOIN users u ON r.referred_user_id = u.id WHERE r.referrer_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [userId]);
        } catch (e) { console.error("Referrals query failed:", e.message); }
        let commissions = { rows: [] };
        try {
            commissions = await db.query(`SELECT c.*, u.email as referred_email FROM affiliate_commissions c JOIN users u ON c.referred_user_id = u.id WHERE c.referrer_id = $1 ORDER BY c.created_at DESC LIMIT 20`, [userId]);
        } catch (e) { console.error("Commissions query failed:", e.message); }
        return {
            referralCode: code,
            balance: (u.affiliate_balance_cents || 0) / 100,
            totalReferrals: u.total_referrals || 0,
            totalEarned: (u.total_affiliate_earned_cents || 0) / 100,
            currentTier: "standard",
            tierBonus: 0,
            referrals: referrals.rows,
            commissions: commissions.rows,
            referralLink: `https://shop.heavenslive.com/register?ref=${code}`
        };
    } catch (error) {
        console.error("getAffiliateDashboard error:", error);
        return null;
    }
}

// Request payout
async function requestPayout(userId, amount, paypalEmail) {
    try {
        const user = await db.query(
            'SELECT affiliate_balance_cents FROM users WHERE id = $1',
            [userId]
        );
        if (user.rows.length === 0) return { success: false, error: 'User not found' };
        
        const amountCents = Math.round(amount * 100);
        if (user.rows[0].affiliate_balance_cents < amountCents) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        const settings = await db.query(
            'SELECT setting_value FROM affiliate_settings WHERE setting_key = $1',
            ['commission_structure']
        );
        const minPayout = settings.rows[0]?.setting_value?.minimum_payout_cents || 2500;
        
        if (amountCents < minPayout) {
            return { success: false, error: `Minimum payout is $${(minPayout / 100).toFixed(2)}` };
        }
        
        await db.query('BEGIN');
        
        // Create payout request
        await db.query(`
            INSERT INTO affiliate_payouts (affiliate_id, amount_cents, paypal_email, status)
            VALUES ($1, $2, $3, 'pending')
        `, [userId, amountCents, paypalEmail]);
        
        // Deduct from balance
        await db.query(
            'UPDATE users SET affiliate_balance_cents = affiliate_balance_cents - $1 WHERE id = $2',
            [amountCents, userId]
        );
        
        await db.query('COMMIT');
        
        return { success: true, message: 'Payout requested successfully' };
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Request payout error:', error);
        return { success: false, error: error.message };
    }
}

// Award commission when a referred user SELLS something
async function awardSaleCommission(sellerId, listingId, amountCents, saleCommissionRate) {
    try {
        // Check if seller was referred
        const ref = await db.query(
            'SELECT referrer_id FROM referrals WHERE referred_user_id = $1',
            [sellerId]
        );
        if (ref.rows.length === 0) return 0;
        
        const rate = saleCommissionRate || 2; // default 2%
        const commissionCents = Math.round(amountCents * rate / 100);
        
        await db.query(
            'INSERT INTO affiliate_commissions (referrer_id, referred_user_id, purchase_id, amount_cents, commission_rate, commission_cents, commission_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [ref.rows[0].referrer_id, sellerId, listingId, amountCents, rate, commissionCents, 'sale', 'pending']
        );
        
        await db.query(
            'UPDATE users SET affiliate_balance_cents = affiliate_balance_cents + $1, total_affiliate_earned_cents = total_affiliate_earned_cents + $1 WHERE id = $2',
            [commissionCents, ref.rows[0].referrer_id]
        );
        
        console.log('Sale commission awarded:', commissionCents, 'cents to', ref.rows[0].referrer_id);
        return commissionCents;
    } catch (e) { console.log('Sale commission error:', e.message); return 0; }
}

module.exports = { awardSaleCommission,
    generateReferralCode,
    trackReferral,
    processReferralPurchase,
    getAffiliateDashboard,
    requestPayout
};
