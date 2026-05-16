/**
 * JWT Token Service — Refresh Token System
 * 
 * Issues short-lived access tokens (24h) + longer refresh tokens (7d).
 * Refresh tokens are stored in DB and can be revoked.
 * 
 * Flow:
 * - Login → returns { token, refreshToken }
 * - POST /api/auth/refresh → { token: newAccessToken }
 * - Refresh tokens are single-use rotated (old one invalidated)
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { jwtSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../config/auth');

class TokenService {
  /**
   * Generate access token (short-lived).
   */
  static generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, isSuperAdmin: user.is_super_admin === true },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
  }

  /**
   * Generate refresh token and store in DB.
   */
  static async generateRefreshToken(userId, deviceFingerprint, ip) {
    const token = crypto.randomBytes(48).toString('hex');
    const family = crypto.randomBytes(16).toString('hex'); // Token family for rotation tracking

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, token_family, device_fingerprint, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${jwtRefreshExpiresIn.replace('d', ' days')}')
       ON CONFLICT (token_family) DO NOTHING`,
      [userId, token, family, deviceFingerprint, ip]
    );

    return token;
  }

  /**
   * Validate and rotate refresh token.
   * - If valid: issues new access token AND new refresh token (rotation)
   * - If token family was already used (reuse detected): revokes entire family (theft protection)
   */
  static async refreshTokens(refreshToken, deviceFingerprint, ip) {
    const result = await db.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      // Check if this was part of a revoked family (potential theft)
      const revoked = await db.query(
        `SELECT token_family FROM refresh_token_revocations WHERE token_family IN (
          SELECT token_family FROM refresh_tokens WHERE token = $1
        )`,
        [refreshToken]
      );
      if (revoked.rows.length > 0) {
        throw new Error('TOKEN_THEFT_DETECTED');
      }
      throw new Error('Invalid or expired refresh token');
    }

    const tokenRecord = result.rows[0];

    // Check for family reuse (rotation theft detection)
    if (tokenRecord.is_used) {
      // Someone used an already-used token — revoke the whole family
      await db.query(
        `INSERT INTO refresh_token_revocations (token_family, revoked_at)
         VALUES ($1, NOW()) ON CONFLICT DO NOTHING`,
        [tokenRecord.token_family]
      );
      // Delete all tokens in this family
      await db.query(
        `DELETE FROM refresh_tokens WHERE token_family = $1`,
        [tokenRecord.token_family]
      );
      throw new Error('TOKEN_THEFT_DETECTED');
    }

    // Mark current token as used
    await db.query(
      `UPDATE refresh_tokens SET is_used = true WHERE id = $1`,
      [tokenRecord.id]
    );

    // Issue new refresh token (rotation) from same family
    const newToken = crypto.randomBytes(48).toString('hex');
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, token_family, device_fingerprint, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${jwtRefreshExpiresIn.replace('d', ' days')}')`,
      [tokenRecord.user_id, newToken, tokenRecord.token_family, deviceFingerprint, ip]
    );

    // Get user for new access token
    const user = await db.query(
      `SELECT id, email, is_super_admin FROM users WHERE id = $1`,
      [tokenRecord.user_id]
    );

    return {
      accessToken: TokenService.generateAccessToken(user.rows[0]),
      refreshToken: newToken,
    };
  }

  /**
   * Revoke all refresh tokens for a user (logout all devices).
   */
  static async revokeAllForUser(userId) {
    await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  }

  /**
   * Revoke a single refresh token.
   */
  static async revokeToken(refreshToken) {
    await db.query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
  }

  /**
   * Clean up expired tokens.
   */
  static async cleanup() {
    await db.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`);
    await db.query(`DELETE FROM refresh_token_revocations WHERE revoked_at < NOW() - INTERVAL '30 days'`);
  }
}

module.exports = TokenService;
