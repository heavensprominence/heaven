const pool = require('../config/database');

class AuditLog {
  /**
   * Create an audit log entry
   */
  static async create({ adminId, action, targetType, targetId, details, ipAddress }) {
    const result = await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [adminId, action, targetType, targetId, details || {}, ipAddress || null]
    );
    return result.rows[0];
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs({ adminId = null, action = null, limit = 100, offset = 0 }) {
    let query = `
      SELECT al.*, u.email as admin_email
      FROM audit_logs al
      LEFT JOIN users u ON al.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (adminId) {
      query += ` AND al.admin_id = $${paramIndex++}`;
      params.push(adminId);
    }

    if (action) {
      query += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get actions by target
   */
  static async getByTarget(targetType, targetId) {
    const result = await pool.query(
      `SELECT al.*, u.email as admin_email
       FROM audit_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       WHERE al.target_type = $1 AND al.target_id = $2
       ORDER BY al.created_at DESC`,
      [targetType, targetId]
    );
    return result.rows;
  }
}

module.exports = AuditLog;