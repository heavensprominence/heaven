const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

const requireAdmin = async (req, res, next) => {
    try {
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [req.userId]
        );
        if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.get('/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const commission = await db.query("SELECT setting_value FROM affiliate_settings WHERE setting_key = 'commission_structure'");
        const tiers = await db.query("SELECT setting_value FROM affiliate_settings WHERE setting_key = 'reward_tiers'");
        res.json({
            commission: commission.rows[0]?.setting_value || {},
            tiers: tiers.rows[0]?.setting_value || {}
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings/commission', verifyToken, requireAdmin, async (req, res) => {
    try {
        await db.query(
            "UPDATE affiliate_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = 'commission_structure'",
            [JSON.stringify(req.body)]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings/tiers', verifyToken, requireAdmin, async (req, res) => {
    try {
        await db.query(
            "UPDATE affiliate_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = 'reward_tiers'",
            [JSON.stringify(req.body)]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/payouts', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, u.email as affiliate_email 
            FROM affiliate_payouts p 
            JOIN users u ON p.affiliate_id = u.id 
            WHERE p.status = 'pending' 
            ORDER BY p.created_at DESC
        `);
        res.json({ payouts: result.rows || [] });
    } catch (error) {
        console.error('Payouts error:', error.message);
        res.json({ payouts: [] });
    }
});

router.post('/payouts/:id/process', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query(
            "UPDATE affiliate_payouts SET status = $1, processed_at = NOW() WHERE id = $2",
            [status, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
