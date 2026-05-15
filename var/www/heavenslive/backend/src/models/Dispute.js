const pool = require('../config/database');

class Dispute {
  // Create dispute
  static async create({ userId, transactionId, orderId, title, description }) {
    const result = await pool.query(
      `INSERT INTO disputes (user_id, transaction_id, order_id, title, description, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [userId, transactionId, orderId, title, description]
    );
    return result.rows[0];
  }
  
  // Get user's disputes
  static async getUserDisputes(userId) {
    const result = await pool.query(
      `SELECT * FROM disputes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
  
  // Get all disputes (admin)
  static async getAllDisputes(limit = 100, offset = 0, status = null) {
    let query = `
      SELECT d.*, u.email, u.full_name
      FROM disputes d
      JOIN users u ON d.user_id = u.id
    `;
    const params = [];
    
    if (status) {
      query += ` WHERE d.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Update dispute status (admin)
  static async updateStatus(disputeId, status, resolutionNotes, adminId) {
    const result = await pool.query(
      `UPDATE disputes 
       SET status = $2, resolution_notes = $3, resolved_by = $4, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [disputeId, status, resolutionNotes, adminId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($5, $6, $7, $8, $9)`,
      [adminId, 'UPDATE_DISPUTE', 'dispute', disputeId, JSON.stringify({ status, resolutionNotes })]
    );
    
    return result.rows[0];
  }
  
  // Add note to dispute
  static async addNote(disputeId, note, userId, isAdmin = false) {
    // For simplicity, store notes in resolution_notes with timestamps
    const dispute = await pool.query(
      `SELECT resolution_notes FROM disputes WHERE id = $1`,
      [disputeId]
    );
    
    const currentNotes = dispute.rows[0].resolution_notes || '';
    const newNote = `[${new Date().toISOString()}] ${isAdmin ? 'ADMIN' : 'USER'}: ${note}\n`;
    const updatedNotes = currentNotes + newNote;
    
    const result = await pool.query(
      `UPDATE disputes 
       SET resolution_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [disputeId, updatedNotes]
    );
    
    return result.rows[0];
  }
  
  // Get dispute by ID
  static async getById(disputeId) {
    const result = await pool.query(
      `SELECT d.*, u.email, u.full_name
       FROM disputes d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [disputeId]
    );
    return result.rows[0];
  }
}

module.exports = Dispute;