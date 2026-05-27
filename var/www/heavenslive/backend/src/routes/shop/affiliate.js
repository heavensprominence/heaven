const db = require("../../db");
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { getAffiliateDashboard, requestPayout } = require('../../services/affiliateService');

// Get affiliate data (root — same as dashboard)
router.get('/', verifyToken, async (req, res) => {
    try {
        const dashboard = await getAffiliateDashboard(req.userId);
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get affiliate dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const dashboard = await getAffiliateDashboard(req.userId);
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request payout
router.post('/payout', verifyToken, async (req, res) => {
    try {
        const { amount, paypalEmail } = req.body;
        const result = await requestPayout(req.userId, amount, paypalEmail);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track referral click — records visit to DB immediately, not just on signup
router.get('/click/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase().trim();
        if (!code || code.length < 6) return res.status(400).json({ error: 'Invalid referral code' });
        
        // Look up the referrer
        const referrer = await db.query('SELECT id, referral_code FROM users WHERE referral_code = $1', [code]);
        if (referrer.rows.length === 0) return res.status(404).json({ error: 'Invalid referral code' });
        
        // Record the click — use referrals table with NULL referred_user_id
        // Will be updated when the visitor signs up
        const visitorIp = req.ip || req.connection?.remoteAddress || '';
        await db.query(
            `INSERT INTO referral_visits (referrer_id, referral_code, visitor_ip, user_agent)
             VALUES ($1, $2, $3, $4)`,
            [referrer.rows[0].id, code, visitorIp, req.headers['user-agent']?.substring(0, 500) || '']
        );
        
        res.json({ success: true, referrer: referrer.rows[0].referral_code });
    } catch (error) {
        // Table might not exist yet — fail gracefully
        res.json({ success: true, note: 'tracking deferred' });
    }
});

// Get public referral info (for share pages)
router.get('/info/:code', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT full_name, total_referrals FROM users WHERE referral_code = $1',
            [req.params.code.toUpperCase()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }
        res.json({ referrer: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
