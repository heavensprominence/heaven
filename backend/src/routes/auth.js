const { verifyToken } = require("../middleware/auth");
const express = require('express');
const { jwtSecret } = require('../config/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../db');
const { sendVerificationEmail, sendPasswordResetEmail, sendLoginVerificationCode } = require('../services/emailService');

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to generate device fingerprint
const generateDeviceFingerprint = (req) => {
    const parts = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.ip || ''
    ];
    return require('crypto').createHash('sha256').update(parts.join('|')).digest('hex');
};

const isTwoFactorRequired = async (userId, deviceFingerprint, req) => {
  const deviceResult = await db.query(
    `SELECT last_verified_at FROM trusted_devices 
     WHERE user_id = $1 AND device_fingerprint = $2`,
    [userId, deviceFingerprint]
  );
  
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const userResult = await db.query(
    `SELECT last_mandatory_2fa FROM users WHERE id = $1`,
    [userId]
  );
  
  const lastMandatory2fa = userResult.rows[0]?.last_mandatory_2fa;
  const needsYearlyVerification = !lastMandatory2fa || new Date(lastMandatory2fa) < oneYearAgo;
  
  if (deviceResult.rows.length === 0 || needsYearlyVerification) {
    return { required: true, needsYearlyVerification, deviceTrusted: deviceResult.rows.length > 0 };
  }
  
  const lastVerified = deviceResult.rows[0].last_verified_at;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (new Date(lastVerified) < thirtyDaysAgo) {
    return { required: true, needsYearlyVerification: false, deviceTrusted: true };
  }
  
  return { required: false, needsYearlyVerification: false, deviceTrusted: true };
};

const sendTwoFactorCode = async (userId, email, sessionId, req) => {
  const code = require('crypto').randomInt(100000, 1000000).toString();
  await db.query(
    `INSERT INTO login_verification_codes (user_id, session_id, code, expires_at) 
     VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
    [userId, sessionId, code]
  );
  await sendLoginVerificationCode(email, code);
};

// POST /login – with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      `SELECT id, email, password_hash, is_active, is_suspended, is_super_admin, email_verified, referral_code
       FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    if (user.is_suspended) return res.status(401).json({ error: 'Account is suspended' });
    if (!user.email_verified) return res.status(401).json({ error: 'Please verify your email address first' });
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });
    const deviceFingerprint = generateDeviceFingerprint(req);
    const sessionId = uuidv4();
    const twoFactorCheck = await isTwoFactorRequired(user.id, deviceFingerprint, req);
    if (twoFactorCheck.required) {
      await sendTwoFactorCode(user.id, user.email, sessionId, req);
      return res.status(200).json({
        requiresTwoFactor: true,
        sessionId: sessionId,
        message: 'Verification code sent to your email',
        deviceTrusted: twoFactorCheck.deviceTrusted,
        needsYearlyVerification: twoFactorCheck.needsYearlyVerification
      });
    }
    if (twoFactorCheck.needsYearlyVerification) {
      await db.query(`UPDATE users SET last_mandatory_2fa = NOW() WHERE id = $1`, [user.id]);
    }
    await db.query(
      `INSERT INTO trusted_devices (user_id, device_fingerprint, user_agent, ip_address, last_verified_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, device_fingerprint) 
       DO UPDATE SET last_verified_at = NOW(), user_agent = $3, ip_address = $4`,
      [user.id, deviceFingerprint, req.headers['user-agent'] || '', req.ip || '']
    );
    
    const token = jwt.sign(
      { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' },
      jwtSecret,
      { expiresIn: '24h' }
    );
    const TokenService = require('../services/tokenService');
    const refreshToken = await TokenService.generateRefreshToken(user.id, deviceFingerprint, req.ip || '');
    
    res.json({ success: true, token, refreshToken, user: { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /verify-2fa – existing, unchanged
router.post('/verify-2fa', twoFactorLimiter, async (req, res) => {
  const { sessionId, code, rememberDevice } = req.body;
  try {
    const result = await db.query(
      `SELECT user_id, code, expires_at, verified 
       FROM login_verification_codes 
       WHERE session_id = $1 AND verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [sessionId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired verification session' });
    const verification = result.rows[0];
    if (new Date(verification.expires_at) < new Date()) return res.status(401).json({ error: 'Verification code has expired. Please login again.' });
    if (verification.code !== code) return res.status(401).json({ error: 'Invalid verification code' });
    await db.query(`UPDATE login_verification_codes SET verified = true WHERE session_id = $1`, [sessionId]);
    const userResult = await db.query(`SELECT id, email, is_super_admin, referral_code FROM users WHERE id = $1`, [verification.user_id]);
    const user = userResult.rows[0];
    await db.query(`UPDATE users SET last_mandatory_2fa = NOW() WHERE id = $1`, [user.id]);
    const deviceFingerprint = generateDeviceFingerprint(req);
    if (rememberDevice === true) {
      await db.query(
        `INSERT INTO trusted_devices (user_id, device_fingerprint, user_agent, ip_address, last_verified_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, device_fingerprint) 
         DO UPDATE SET last_verified_at = NOW(), user_agent = $3, ip_address = $4`,
        [user.id, deviceFingerprint, req.headers['user-agent'] || '', req.ip || '']
      );
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' },
      jwtSecret,
      { expiresIn: '24h' }
    );
    const TokenService = require('../services/tokenService');
    const refreshToken = await TokenService.generateRefreshToken(user.id, deviceFingerprint, req.ip || '');
    
    res.json({ success: true, token, refreshToken, user: { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' } });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /register – UPDATED for unified auth
router.post("/register", registerLimiter, async (req, res) => {
    try {
        const { email, password, fullName, source, inviteCode, referralCode, joinReason } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        
        const refCode = referralCode || inviteCode;
        
        // Credon: referral code OR join reason required
        if (source === 'credon') {
            if (!refCode && !joinReason) {
                return res.status(403).json({ 
                    error: "Please enter a referral code or tell us why you want to join.",
                    code: 'INVITE_REQUIRED'
                });
            }
            if (refCode) {
                try {
                    const InviteService = require('../services/inviteService');
                    await InviteService.validateCode(refCode);
                } catch(e) { /* Invalid code — allow registration */ }
            }
        }
        
        const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const crypto = require("crypto");
        const verificationToken = crypto.randomBytes(32).toString("hex");
        
        // If invited, track the referrer
        const invitedBy = (source === 'credon' && inviteCode)
            ? (require('../services/inviteService').validateCode(inviteCode).then(r => r.affiliateId).catch(() => null))
            : null;
        
        const result = await db.query(
            "INSERT INTO users (email, password_hash, full_name, email_verification_token, email_verified, join_reason, credon_pending, credon_approved) VALUES ($1, $2, $3, $4, false, $5, $6, $7) RETURNING id, email, full_name",
            [email, hashedPassword, fullName || null, verificationToken, joinReason || null, joinReason ? true : false, false]
        );
        
        // Handle referral tracking
        if (refCode) {
            try {
                const refUser = await db.query('SELECT id FROM users WHERE referral_code = $1', [refCode]);
                if (refUser.rows.length > 0) {
                    await db.query('UPDATE users SET referred_by = $1 WHERE id = $2', [refUser.rows[0].id, result.rows[0].id]);
                }
            } catch(e) {}
        }
        
        try {
            await sendVerificationEmail(email, verificationToken, source || 'shop');
            console.log("Verification email sent to", email);
        } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
        }
        
        res.status(201).json({ success: true, message: "Registration successful! Please check your email to verify your account.", user: result.rows[0] });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /verify-email – Sends token as HTML form auto-POST for security
// (avoids JWT in URL/Referrer headers)
router.get("/verify-email", async (req, res) => {
    try {
        const { token, redirect } = req.query;
        if (!token) return res.status(400).send("Missing verification token");
        
        const result = await db.query(
            "UPDATE users SET email_verified = true, email_verification_token = NULL, last_mandatory_2fa = NOW() WHERE email_verification_token = $1 RETURNING id, email, is_super_admin",
            [token]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).send("Invalid or expired verification link. Please register again.");
        }
        
        const user = result.rows[0];
        const autoToken = jwt.sign(
            { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' },
            jwtSecret,
            { expiresIn: "1h" }
        );
        
        const deviceFingerprint = generateDeviceFingerprint(req);
        await db.query(
            "INSERT INTO trusted_devices (user_id, device_fingerprint, user_agent, ip_address, last_verified_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET last_verified_at = NOW()",
            [user.id, deviceFingerprint, req.headers["user-agent"] || "", req.ip || ""]
        );
        
        const targetBase = (redirect === 'credon') ? '/credon' : '/shop';
        // Use form auto-submit to keep token out of Referrer headers
        res.send(`<!DOCTYPE html><html><head><title>Email Verified</title></head><body>
            <p>Email verified! Redirecting...</p>
            <form id="f" method="POST" action="${targetBase}/token-exchange">
                <input type="hidden" name="token" value="${autoToken}" />
            </form>
            <script>document.getElementById('f').submit();</script>
            </body></html>`);
    } catch (error) {
        console.error("Verify email error:", error);
        res.status(500).send("Verification failed. Please try again.");
    }
});

// POST /token-exchange – accept token from POST body (keeps it out of URL)
router.post('/token-exchange', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Missing token' });
        const decoded = jwt.verify(token, jwtSecret);
        res.json({ success: true, token, user: { id: decoded.id, email: decoded.email, isSuperAdmin: decoded.isSuperAdmin } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// resend-2fa, trusted-devices, me – existing, kept unchanged
router.post('/resend-2fa', async (req, res) => {
    const { sessionId } = req.body;
    try {
        const result = await db.query(`SELECT user_id FROM login_verification_codes WHERE session_id = $1 AND verified = false ORDER BY created_at DESC LIMIT 1`, [sessionId]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid session' });
        const userId = result.rows[0].user_id;
        const userResult = await db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) return res.status(401).json({ error: 'User not found' });
        const code = require('crypto').randomInt(100000, 1000000).toString();
        await db.query(`INSERT INTO login_verification_codes (user_id, session_id, code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`, [userId, sessionId, code]);
        await sendLoginVerificationCode(userResult.rows[0].email, code);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/trusted-devices', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`SELECT id, device_fingerprint, user_agent, ip_address, last_verified_at, created_at FROM trusted_devices WHERE user_id = $1 ORDER BY last_verified_at DESC`, [req.userId]);
        res.json({ devices: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/trusted-devices/:id', verifyToken, async (req, res) => {
    try {
        await db.query(`DELETE FROM trusted_devices WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, email, full_name, is_super_admin, referral_code FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        // Check if TOTP is enabled
        const totpResult = await db.query('SELECT is_enabled FROM user_totp WHERE user_id = $1', [req.userId]);
        const user = result.rows[0];
        user.totp_enabled = totpResult.rows.length > 0 && totpResult.rows[0].is_enabled;
        
        res.json({ user });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// === TOTP (Authenticator App) Routes ===
const TOTPService = require('../services/totpService');

// Setup TOTP – generates secret & QR code
router.post('/totp/setup', verifyToken, async (req, res) => {
    try {
        const { secret, otpauth_url } = await TOTPService.generateSecret(req.userId, req.userEmail);
        const qrCode = await TOTPService.generateQRCode(otpauth_url);
        res.json({ secret, qrCode });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Verify & enable TOTP
router.post('/totp/enable', verifyToken, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Verification code required' });
        const result = await TOTPService.verifyAndEnable(req.userId, code);
        res.json(result);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

// Disable TOTP
router.post('/totp/disable', verifyToken, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Current code required to disable' });
        const result = await TOTPService.disable(req.userId, code);
        res.json(result);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

// Verify TOTP during login (second factor)
router.post('/totp/verify', async (req, res) => {
    try {
        const { sessionId, code } = req.body;
        if (!sessionId || !code) return res.status(400).json({ error: 'Session ID and code required' });
        
        // Get the pending session
        const sessionResult = await db.query(
            `SELECT user_id FROM login_verification_codes WHERE session_id = $1 AND verified = false ORDER BY created_at DESC LIMIT 1`,
            [sessionId]
        );
        if (sessionResult.rows.length === 0) return res.status(401).json({ error: 'Invalid session' });
        
        const userId = sessionResult.rows[0].user_id;
        const validation = await TOTPService.validateToken(userId, code);
        
        if (!validation.valid) {
            return res.status(401).json({ error: validation.reason || 'Invalid code' });
        }
        
        // Mark session as verified
        await db.query(`UPDATE login_verification_codes SET verified = true WHERE session_id = $1`, [sessionId]);
        
        // Issue token
        const userResult = await db.query(`SELECT id, email, is_super_admin, referral_code FROM users WHERE id = $1`, [userId]);
        const user = userResult.rows[0];
        
        await db.query(`UPDATE users SET last_mandatory_2fa = NOW() WHERE id = $1`, [user.id]);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' },
            jwtSecret,
            { expiresIn: '24h' }
        );
        
        res.json({ success: true, token, user: { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true, referral_code: user.referral_code || '' } });
    } catch (error) {
        console.error('TOTP verify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Token Refresh ===
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
        
        const deviceFingerprint = generateDeviceFingerprint(req);
        const TokenService = require('../services/tokenService');
        const tokens = await TokenService.refreshTokens(refreshToken, deviceFingerprint, req.ip || '');
        
        res.json(tokens);
    } catch (error) {
        if (error.message === 'TOKEN_THEFT_DETECTED') {
            return res.status(401).json({ error: 'Security alert: token reuse detected. All sessions revoked.' });
        }
        res.status(401).json({ error: error.message });
    }
});

// Logout (revoke refresh token)
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const TokenService = require('../services/tokenService');
            await TokenService.revokeToken(refreshToken);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// === 2FA Settings (Telegram + WhatsApp) ===
const TwoFactorService = require('../services/twoFactorService');

router.get('/2fa-settings', verifyToken, async (req, res) => {
    try {
        const settings = await TwoFactorService.getUser2FASettings(req.userId);
        res.json({ settings });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/2fa/telegram', verifyToken, async (req, res) => {
    try {
        const { chat_id } = req.body;
        if (!chat_id) return res.status(400).json({ error: 'chat_id required. Message @HeavensLiveBot on Telegram to get yours.' });
        await TwoFactorService.setTelegramChatId(req.userId, chat_id);
        res.json({ success: true, message: 'Telegram 2FA enabled. You will receive codes via Telegram.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/2fa/whatsapp', verifyToken, async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) return res.status(400).json({ error: 'phone_number required (e.g., +16472281215)' });
        await TwoFactorService.setWhatsAppNumber(req.userId, phone_number);
        res.json({ success: true, message: 'WhatsApp 2FA enabled. You will receive codes via WhatsApp.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/2fa/preferred', verifyToken, async (req, res) => {
    try {
        const { method } = req.body;
        if (!['email','telegram','whatsapp','totp'].includes(method)) {
            return res.status(400).json({ error: 'Invalid method. Choose: email, telegram, whatsapp, or totp' });
        }
        await TwoFactorService.setPreferredMethod(req.userId, method);
        res.json({ success: true, method });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Generate API key
router.post('/api-key', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        const crypto = require('crypto');
        const key = 'hl_' + crypto.randomBytes(24).toString('hex');
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        const prefix = key.substring(0, 11);
        await db.query(
            'INSERT INTO api_keys (user_id, name, key_hash, prefix) VALUES ($1, $2, $3, $4)',
            [req.userId, name || 'Default', hash, prefix]
        );
        res.json({ success: true, api_key: key, prefix, message: 'Store this key securely. It will not be shown again.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// List user's API keys
router.get('/api-keys', verifyToken, async (req, res) => {
    try {
        const keys = await db.query(
            'SELECT id, name, prefix, rate_limit, is_active, last_used_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json({ keys: keys.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Revoke API key
router.delete('/api-key/:id', verifyToken, async (req, res) => {
    try {
        await db.query('UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = { router, verifyToken };
