const pool = require('../config/database');

class Order {
  // Create an order
  static async create({ userId, type, amountUsd, shippingAddress = null }) {
    const result = await pool.query(
      `INSERT INTO orders (user_id, type, amount_usd, shipping_address, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, type, amountUsd, shippingAddress]
    );
    return result.rows[0];
  }
  
  // Update order with PayPal info
  static async updatePayPalInfo(orderId, paypalOrderId) {
    const result = await pool.query(
      `UPDATE orders SET paypal_order_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paypalOrderId, orderId]
    );
    return result.rows[0];
  }
  
  // Mark order as paid
  static async markAsPaid(orderId) {
    const result = await pool.query(
      `UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [orderId]
    );
    return result.rows[0];
  }
  
  // Update shipping info
  static async updateShipping(orderId, trackingNumber, carrier) {
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'shipped', shipping_tracking_number = $2, shipping_carrier = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [orderId, trackingNumber, carrier]
    );
    return result.rows[0];
  }
  
  // Get user's orders
  static async getUserOrders(userId) {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
  
  // Get order by ID
  static async getById(orderId) {
    const result = await pool.query(
      `SELECT o.*, u.email, u.full_name 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );
    return result.rows[0];
  }
  
  // Get all orders (admin)
  static async getAllOrders(limit = 100, offset = 0, status = null) {
    let query = `
      SELECT o.*, u.email, u.full_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    
    if (status) {
      query += ` WHERE o.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Order;