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
