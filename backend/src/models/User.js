const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create new user
  static async create({ email, password, fullName, whatsappNumber }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, whatsapp_number, email_verification_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, whatsapp_number, is_super_admin, created_at`,
      [email, hashedPassword, fullName, whatsappNumber, verificationToken]
    );
    
    // Create wallet for user
    await pool.query(
      `INSERT INTO wallets (user_id) VALUES ($1)`,
      [result.rows[0].id]
    );
    
    return result.rows[0];
  }
  
  // Find user by email
  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0];
  }
  
  // Find user by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, email, full_name, whatsapp_number, is_super_admin, is_suspended, 
              suspension_end_date, created_at, last_login, email_verified
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }
  
  // Verify password
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
  
  // Update last login
  static async updateLastLogin(id) {
    await pool.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }
  
  // Set password reset token
  static async setPasswordResetToken(email) {
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    await pool.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3`,
      [token, expires, email]
    );
    
    return token;
  }
  
  // Reset password
  static async resetPassword(token, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE password_reset_token = $2 AND password_reset_expires > CURRENT_TIMESTAMP
       RETURNING id, email`,
      [hashedPassword, token]
    );
    
    return result.rows[0];
  }
  
  // Suspend user
  static async suspend(userId, durationDays, reason, adminId) {
    const suspensionEndDate = durationDays === null ? null : 
      new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    
    const result = await pool.query(
      `UPDATE users 
       SET is_suspended = TRUE, suspension_end_date = $2, suspension_reason = $3
       WHERE id = $1
       RETURNING id, is_suspended, suspension_end_date`,
      [userId, suspensionEndDate, reason]
    );
    
    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'SUSPEND_USER', 'user', userId, JSON.stringify({ durationDays, reason })]
    );
    
    return result.rows[0];
  }
  
  // Unsuspend user
  static async unsuspend(userId, adminId) {
    const result = await pool.query(
      `UPDATE users 
       SET is_suspended = FALSE, suspension_end_date = NULL, suspension_reason = NULL
       WHERE id = $1
       RETURNING id, is_suspended`,
      [userId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'UNSUSPEND_USER', 'user', userId, JSON.stringify({})]
    );
    
    return result.rows[0];
  }
  
  // Check if user is suspended
  static async isSuspended(userId) {
    const result = await pool.query(
      `SELECT is_suspended, suspension_end_date 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (!result.rows[0]) return false;
    
    const { is_suspended, suspension_end_date } = result.rows[0];
    if (!is_suspended) return false;
    
    if (suspension_end_date && new Date(suspension_end_date) < new Date()) {
      // Suspension expired
      await this.unsuspend(userId, null);
      return false;
    }
    
    return true;
  }
}

module.exports = User;