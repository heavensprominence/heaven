/**
 * TOTP Two-Factor Authentication Service
 * Uses speakeasy (free, RFC 6238) — no external provider needed.
 * Users can use Google Authenticator, Authy, or any TOTP app.
 */
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../db');

class TOTPService {
  /**
   * Generate a new TOTP secret for a user.
   * Returns the secret (base32) and an otpauth URL for QR code generation.
   */
  static async generateSecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `HeavensLive:${email}`,
      issuer: 'HeavensLive',
    });

    // Store secret (encrypted in production)
    await db.query(
      `INSERT INTO user_totp (user_id, secret, is_enabled, created_at)
       VALUES ($1, $2, false, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET secret = $2, is_enabled = false, updated_at = NOW()`,
      [userId, secret.base32]
    );

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    };
  }

  /**
   * Generate a QR code data URL for the TOTP setup.
   */
  static async generateQRCode(otpauthUrl) {
    return await QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verify a TOTP token and enable TOTP for the user.
   */
  static async verifyAndEnable(userId, token) {
    const result = await db.query(
      'SELECT secret FROM user_totp WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      throw new Error('TOTP not set up. Generate a secret first.');
    }

    const verified = speakeasy.totp.verify({
      secret: result.rows[0].secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 period drift (30 seconds)
    });

    if (!verified) {
      return { success: false, message: 'Invalid verification code. Please try again.' };
    }

    await db.query(
      'UPDATE user_totp SET is_enabled = true, verified_at = NOW(), updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    return { success: true, message: 'TOTP enabled successfully.' };
  }

  /**
   * Validate a TOTP token during login.
   */
  static async validateToken(userId, token) {
    const result = await db.query(
      'SELECT secret, is_enabled FROM user_totp WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0 || !result.rows[0].is_enabled) {
      return { valid: false, reason: 'TOTP not enabled for this account.' };
    }

    const verified = speakeasy.totp.verify({
      secret: result.rows[0].secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return { valid: false, reason: 'Invalid code.' };
    }

    return { valid: true };
  }

  /**
   * Disable TOTP for a user (requires current valid token).
   */
  static async disable(userId, token) {
    const validation = await this.validateToken(userId, token);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid token');
    }

    await db.query(
      'UPDATE user_totp SET is_enabled = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    return { success: true };
  }

  /**
   * Check if TOTP is enabled for a user.
   */
  static async isEnabled(userId) {
    const result = await db.query(
      'SELECT is_enabled FROM user_totp WHERE user_id = $1',
      [userId]
    );
    return result.rows.length > 0 && result.rows[0].is_enabled;
  }
}

module.exports = TOTPService;
