/**
 * Referral & Affiliate Engine 2.0
 * Automated tracking, viral loops, commission dashboard.
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// GET /api/affiliate/dashboard — user's referral stats
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const [user, referrals, commissions] = await Promise.all([
      db.query('SELECT referral_code, affiliate_commission_rate FROM users WHERE id = $1', [userId]),
      db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'30 days\') as this_month FROM users WHERE referred_by = $1', [userId]),
      db.query('SELECT COALESCE(SUM(commission_cents),0) as total, COALESCE(SUM(commission_cents) FILTER (WHERE status = \'paid\'),0) as paid FROM affiliate_commissions WHERE referrer_id = $1', [userId])
    ]);
    const u = user.rows[0] || {};
    res.json({
      referralCode: u.referral_code,
      referralLink: `https://heavenslive.com/?ref=${u.referral_code}`,
      commissionRate: u.affiliate_commission_rate || 5,
      totalReferrals: parseInt(referrals.rows[0].total),
      referralsThisMonth: parseInt(referrals.rows[0].this_month),
      totalCommissions: parseInt(commissions.rows[0].total),
      paidCommissions: parseInt(commissions.rows[0].paid)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/affiliate/referrals — list of referred users
router.get('/referrals', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, created_at FROM users WHERE referred_by = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ referrals: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/affiliate/redeem — convert commissions to wallet balance
router.post('/redeem', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    // Get total unpaid commissions
    const unpaid = await db.query(
      'SELECT COALESCE(SUM(commission_cents),0) as total FROM affiliate_commissions WHERE referrer_id = $1 AND status = \'unpaid\'',
      [userId]
    );
    const amount = parseInt(unpaid.rows[0].total);
    if (amount < 100) return res.status(400).json({ error: 'Minimum $1.00 to redeem' });
    
    // Mark commissions as paid
    await db.query("UPDATE affiliate_commissions SET status = 'paid', paid_at = NOW() WHERE referrer_id = $1 AND status = 'unpaid'", [userId]);
    // Add to wallet
    await db.query('UPDATE wallets SET balance_cents = balance_cents + $1 WHERE user_id = $2', [amount, userId]);
    // Record transaction
    await db.query("INSERT INTO transactions (user_id, type, amount_cents, description) VALUES ($1, 'affiliate_redeem', $2, 'Affiliate commission redemption')", [userId, amount]);
    
    res.json({ success: true, amount_cents: amount, amount_usd: (amount/100).toFixed(2) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/affiliate/track — record referral click and set cookie
router.post('/track', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code required' });
    
    const referrer = await db.query('SELECT id FROM users WHERE referral_code = $1', [code]);
    if (referrer.rows.length === 0) return res.status(404).json({ error: 'Invalid referral code' });
    
    // Record click for analytics
    await db.query('INSERT INTO referral_clicks (referrer_id, ip_address, user_agent) VALUES ($1, $2, $3)',
      [referrer.rows[0].id, req.ip, req.headers['user-agent'] || '']);
    
    res.cookie('hl_ref', code, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false, secure: true, sameSite: 'lax' });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
