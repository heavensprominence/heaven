const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

// Helper: verifyToken for routes that need it
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const queryToken = req.query.token;
            if (queryToken) {
                const d = jwt.verify(queryToken, jwtSecret);
                req.userId = d.id; req.userEmail = d.email;
                req.isSuperAdmin = d.isSuperAdmin || false;
                return next();
            }
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.isSuperAdmin = decoded.isSuperAdmin || false;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
        const token = jwt.sign(
            { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin || false, referral_code: user.referral_code },
            jwtSecret,
            { expiresIn: '24h' }
        );
        await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
        res.json({ success: true, token, user: { id: user.id, email: user.email, full_name: user.full_name, referral_code: user.referral_code } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, referralCode, joinReason, source } = req.body;
        if (!email || !password || !fullName) return res.status(400).json({ error: 'Name, email, and password required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
        const hash = await bcrypt.hash(password, 10);
        const referral_code = Math.floor(10000000 + Math.random() * 90000000).toString();
        const credonPending = !!(joinReason);
        const result = await db.query(
            "INSERT INTO users (email, password_hash, full_name, referral_code, join_reason, credon_pending, credon_approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, referral_code",
            [email.toLowerCase().trim(), hash, fullName, referral_code, joinReason || null, credonPending, false]
        );
        const user = result.rows[0];
        // Create wallet
        await db.query("INSERT INTO wallets (user_id, balance_cents) VALUES ($1, 0) ON CONFLICT DO NOTHING", [user.id]);
        const token = jwt.sign(
            { id: user.id, email: user.email, isSuperAdmin: false, referral_code: user.referral_code },
            jwtSecret, { expiresIn: '24h' }
        );
        // Auto-Pro grant
        try { const { grantAutoPro } = require('../services/promotionEngine'); await grantAutoPro(user.id); } catch {}
        res.status(201).json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name }, token, message: 'Account created!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, email, full_name, referral_code, subscription_plan, is_super_admin FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const result = await db.query('SELECT id, email, full_name FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (result.rows.length === 0) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        const user = result.rows[0];
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);
        await db.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3', [user.id, token, expires]);
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/shop/reset-password?token=${token}`;
        try { const { sendEmail } = require('../services/emailService'); await sendEmail(email, 'Reset Your Password', 'reset-password', { name: user.full_name || email.split('@')[0], resetUrl }); } catch {}
        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/reset-password/verify
router.get('/reset-password/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });
        const result = await db.query('SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()', [token]);
        res.json({ valid: result.rows.length > 0 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        const result = await db.query('SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()', [token]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });
        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, result.rows[0].user_id]);
        await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
        res.json({ success: true, message: 'Password updated.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/api-key — Generate API key
router.post('/api-key', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        const crypto = require('crypto');
        const key = 'hl_' + crypto.randomBytes(24).toString('hex');
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        const prefix = key.substring(0, 11);
        await db.query('INSERT INTO api_keys (user_id, name, key_hash, prefix) VALUES ($1, $2, $3, $4)', [req.userId, name || 'Default', hash, prefix]);
        res.json({ success: true, api_key: key, prefix, message: 'Store this key securely.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/api-keys — List user's API keys
router.get('/api-keys', verifyToken, async (req, res) => {
    try {
        const keys = await db.query('SELECT id, name, prefix, rate_limit, is_active, last_used_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json({ keys: keys.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/auth/api-key/:id — Revoke API key
router.delete('/api-key/:id', verifyToken, async (req, res) => {
    try {
        await db.query('UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/auth/account — Self-delete account
router.delete('/account', verifyToken, async (req, res) => {
    try {
        await db.query('DELETE FROM wallets WHERE user_id = $1', [req.userId]);
        await db.query('DELETE FROM transactions WHERE user_id = $1', [req.userId]);
        await db.query('DELETE FROM carts WHERE user_id = $1', [req.userId]);
        await db.query('DELETE FROM listings WHERE seller_id = $1', [req.userId]);
        await db.query('DELETE FROM users WHERE id = $1', [req.userId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
