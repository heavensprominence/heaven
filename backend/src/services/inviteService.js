/**
 * Invite-Only Gate Service
 * Credon currency access is gated behind affiliate invites.
 * Each affiliate gets invite codes they can share.
 */
const crypto = require('crypto');
const db = require('../db');

class InviteService {
  /**
   * Generate a batch of invite codes for an affiliate.
   */
  static async generateCodes(affiliateId, count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = 'HL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await db.query(
        `INSERT INTO affiliate_invites (affiliate_id, code, is_used, created_at)
         VALUES ($1, $2, false, NOW())`,
        [affiliateId, code]
      );
      codes.push(code);
    }
    return codes;
  }

  /**
   * Validate an invite code during registration.
   * Returns affiliate info if valid.
   */
  static async validateCode(code) {
    if (!code || typeof code !== 'string') return { valid: false };

    const result = await db.query(
      `SELECT ai.*, u.full_name as affiliate_name, u.email as affiliate_email
       FROM affiliate_invites ai
       JOIN users u ON ai.affiliate_id = u.id
       WHERE ai.code = $1 AND ai.is_used = false`,
      [code.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Invalid or already used invite code.' };
    }

    return {
      valid: true,
      affiliateId: result.rows[0].affiliate_id,
      affiliateName: result.rows[0].affiliate_name,
      inviteId: result.rows[0].id,
    };
  }

  /**
   * Mark an invite code as used.
   */
  static async markUsed(inviteId, usedByUserId) {
    await db.query(
      `UPDATE affiliate_invites SET is_used = true, used_by = $1, used_at = NOW()
       WHERE id = $2`,
      [usedByUserId, inviteId]
    );
  }

  /**
   * Get invite stats for an affiliate.
   */
  static async getStats(affiliateId) {
    const result = await db.query(
      `SELECT
        COUNT(*) as total_sent,
        COUNT(CASE WHEN is_used THEN 1 END) as total_used,
        COUNT(CASE WHEN NOT is_used THEN 1 END) as remaining
       FROM affiliate_invites
       WHERE affiliate_id = $1`,
      [affiliateId]
    );
    return result.rows[0];
  }

  /**
   * Check if user was invited via affiliate (for bonus tracking).
   */
  static async getInviter(userId) {
    const result = await db.query(
      `SELECT ai.affiliate_id, u.full_name as affiliate_name
       FROM affiliate_invites ai
       JOIN users u ON ai.affiliate_id = u.id
       WHERE ai.used_by = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = InviteService;
