const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Appointment {
  // Create appointment
  static async create({ userId, appointmentTime, durationMinutes = 15, notes = null }) {
    const cancellationToken = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO appointments (user_id, appointment_time, duration_minutes, cancellation_token, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING *`,
      [userId, appointmentTime, durationMinutes, cancellationToken, notes]
    );
    return result.rows[0];
  }
  
  // Get user's appointments
  static async getUserAppointments(userId) {
    const result = await pool.query(
      `SELECT * FROM appointments 
       WHERE user_id = $1 
       ORDER BY appointment_time ASC`,
      [userId]
    );
    return result.rows;
  }
  
  // Get upcoming appointments (admin)
  static async getUpcomingAppointments() {
    const result = await pool.query(
      `SELECT a.*, u.email, u.full_name, u.whatsapp_number
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       WHERE a.status IN ('scheduled', 'confirmed')
         AND a.appointment_time > CURRENT_TIMESTAMP
       ORDER BY a.appointment_time ASC`,
      []
    );
    return result.rows;
  }
  
  // Confirm appointment (admin marks as ready for WhatsApp)
  static async confirmAppointment(appointmentId, adminId) {
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'CONFIRM_APPOINTMENT', 'appointment', appointmentId, JSON.stringify({})]
    );
    
    return result.rows[0];
  }
  
  // Mark WhatsApp contact added
  static async markWhatsAppAdded(appointmentId) {
    const result = await pool.query(
      `UPDATE appointments 
       SET whatsapp_contact_added = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );
    return result.rows[0];
  }
  
  // Cancel appointment (by user via token)
  static async cancelByToken(cancellationToken) {
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE cancellation_token = $1 AND status IN ('scheduled', 'confirmed')
       RETURNING *`,
      [cancellationToken]
    );
    return result.rows[0];
  }
  
  // Cancel appointment (by admin)
  static async cancelByAdmin(appointmentId, adminId) {
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'CANCEL_APPOINTMENT', 'appointment', appointmentId, JSON.stringify({})]
    );
    
    return result.rows[0];
  }
  
  // Reschedule appointment
  static async reschedule(appointmentId, newTime, userId = null) {
    let query = `
      UPDATE appointments 
      SET appointment_time = $2, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    const params = [appointmentId, newTime];
    
    if (userId) {
      query += ` AND user_id = $3`;
      params.push(userId);
    }
    
    query += ` RETURNING *`;
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }
  
  // Complete appointment
  static async completeAppointment(appointmentId, adminId) {
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [appointmentId]
    );
    
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'COMPLETE_APPOINTMENT', 'appointment', appointmentId, JSON.stringify({})]
    );
    
    return result.rows[0];
  }
  
  // Get available time slots (admin sets availability - simplified for mock)
  // In production, you'd have an availability table
  static async getAvailableSlots(date) {
    // This is mock - returns 15-minute slots from 9 AM to 5 PM
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 15, 30, 45]) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if slot is already booked
        const booked = await pool.query(
          `SELECT id FROM appointments 
           WHERE appointment_time = $1 AND status NOT IN ('cancelled')`,
          [slotTime]
        );
        
        if (booked.rows.length === 0) {
          slots.push(slotTime);
        }
      }
    }
    
    return slots;
  }
}

module.exports = Appointment;