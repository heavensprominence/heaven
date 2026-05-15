// Weekly lottery draw — run via cron: 0 9 * * MON node backend/src/scripts/lottery-draw.js
const { Pool } = require('pg');
const pool = new Pool({ user: 'heavenslive', database: 'heavenslive_db' });

async function drawLottery() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find active lottery campaign
    const campaign = await client.query(
      `SELECT * FROM promo_campaigns WHERE type = 'lottery' AND is_active = true AND starts_at <= NOW() AND ends_at >= NOW() FOR UPDATE`
    );
    if (campaign.rows.length === 0) {
      console.log('No active lottery campaign');
      await client.query('ROLLBACK');
      return;
    }
    const c = campaign.rows[0];

    // Calculate week number
    const weekResult = await client.query(
      `SELECT COALESCE(MAX(week_number), 0) + 1 as week FROM lottery_draws WHERE campaign_id = $1`,
      [c.id]
    );
    const week = parseInt(weekResult.rows[0].week);

    // Get all pending entries
    const entries = await client.query(
      `SELECT id, user_id FROM promo_entries WHERE campaign_id = $1 AND status = 'pending' ORDER BY random() LIMIT 5`,
      [c.id]
    );

    if (entries.rows.length === 0) {
      console.log('No lottery entries this week');
      await client.query('ROLLBACK');
      return;
    }

    // Create draw record
    const draw = await client.query(
      `INSERT INTO lottery_draws (campaign_id, week_number) VALUES ($1, $2) RETURNING id`,
      [c.id, week]
    );
    const drawId = draw.rows[0].id;

    // Select winners and grant Business plans
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 12);

    for (let i = 0; i < entries.rows.length; i++) {
      const entry = entries.rows[i];
      
      // Record winner
      await client.query(
        `INSERT INTO lottery_winners (draw_id, entry_id, position) VALUES ($1, $2, $3)`,
        [drawId, entry.id, i + 1]
      );

      // Mark entry as won
      await client.query(
        `UPDATE promo_entries SET status = 'won', won_at = NOW() WHERE id = $1`,
        [entry.id]
      );

      // Grant Business subscription
      await client.query(
        `INSERT INTO subscriptions (user_id, plan, source, duration_months, expires_at, promo_campaign_id) VALUES ($1, $2, 'lottery', 12, $3, $4)`,
        [entry.user_id, 'business', expires, c.id]
      );

      await client.query(
        `UPDATE users SET subscription_plan = 'business' WHERE id = $1`,
        [entry.user_id]
      );
    }

    await client.query('COMMIT');
    console.log(`Week ${week} lottery drawn: ${entries.rows.length} winners`);

    // Email winners (TODO: wire up email service)
    for (const entry of entries.rows) {
      const user = await pool.query('SELECT email FROM users WHERE id = $1', [entry.user_id]);
      console.log(`  Winner: ${user.rows[0]?.email} — Business plan granted`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lottery draw error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

drawLottery();
