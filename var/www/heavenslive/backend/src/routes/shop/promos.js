const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Get active promos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM promo_campaigns WHERE is_active = true AND starts_at <= NOW() AND ends_at >= NOW() ORDER BY starts_at DESC`
    );
    res.json({ promos: result.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Claim a gift promo (instant grant)
router.post('/:id/claim', verifyToken, async (req, res) => {
  const client = await db.query('BEGIN');
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate campaign
    const campaign = await db.query(
      `SELECT * FROM promo_campaigns WHERE id = $1 AND is_active = true AND type = 'gift' AND starts_at <= NOW() AND ends_at >= NOW() FOR UPDATE`,
      [id]
    );
    if (campaign.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Campaign not available' });
    }
    const c = campaign.rows[0];

    // Check max claims
    if (c.max_claims && c.current_claims >= c.max_claims) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'All claims have been taken' });
    }

    // Check user hasn't already claimed
    const existing = await db.query(
      `SELECT id FROM promo_entries WHERE campaign_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already claimed this gift' });
    }

    // Create entry
    const expires = new Date();
    expires.setMonth(expires.getMonth() + (c.duration_months || 12));

    await db.query(
      `INSERT INTO promo_entries (campaign_id, user_id, status, claimed_at) VALUES ($1, $2, 'claimed', NOW())`,
      [id, userId]
    );

    // Grant subscription
    await db.query(
      `INSERT INTO subscriptions (user_id, plan, source, duration_months, expires_at, promo_campaign_id) VALUES ($1, $2, 'promo', $3, $4, $5)`,
      [userId, c.plan, c.duration_months || 12, expires, id]
    );

    // Update user's plan
    await db.query(`UPDATE users SET subscription_plan = $1 WHERE id = $2`, [c.plan, userId]);

    // Increment claims
    await db.query(`UPDATE promo_campaigns SET current_claims = current_claims + 1 WHERE id = $1`, [id]);

    await db.query('COMMIT');
    res.json({ success: true, plan: c.plan, expires_at: expires });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Enter lottery
router.post('/:id/enter', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const campaign = await db.query(
      `SELECT * FROM promo_campaigns WHERE id = $1 AND is_active = true AND type = 'lottery' AND starts_at <= NOW() AND ends_at >= NOW()`,
      [id]
    );
    if (campaign.rows.length === 0) {
      return res.status(400).json({ error: 'Lottery not available' });
    }

    // Check already entered this week
    const existing = await db.query(
      `SELECT id FROM promo_entries WHERE campaign_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already entered this lottery' });
    }

    await db.query(
      `INSERT INTO promo_entries (campaign_id, user_id, status) VALUES ($1, $2, 'pending')`,
      [id, userId]
    );

    res.json({ success: true, message: 'Entered the lottery!' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Check entry status
router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const entry = await db.query(
      `SELECT e.*, c.name, c.type, c.plan FROM promo_entries e JOIN promo_campaigns c ON e.campaign_id = c.id WHERE e.campaign_id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );
    res.json({ entry: entry.rows[0] || null });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
