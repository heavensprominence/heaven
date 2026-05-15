const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Bid {
  // Create a new bid
  static async create({ userId, type, fromCurrency, toCurrency, amountCents, exchangeRate, expiresInHours = 168 }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    const result = await pool.query(
      `INSERT INTO bids (user_id, type, from_currency, to_currency, amount_cents, exchange_rate, expires_at, is_mock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, type, from_currency, to_currency, amount_cents, exchange_rate, status, expires_at, created_at`,
      [userId, type, fromCurrency, toCurrency, amountCents, exchangeRate, expiresAt, true]
    );
    
    return result.rows[0];
  }
  
  // Get open bids for a currency pair
  static async getOpenBids(fromCurrency, toCurrency, type = null) {
    let query = `
      SELECT b.*, u.email as user_email
      FROM bids b
      JOIN users u ON b.user_id = u.id
      WHERE b.status = 'open' 
        AND b.expires_at > CURRENT_TIMESTAMP
        AND b.from_currency = $1
        AND b.to_currency = $2
    `;
    const params = [fromCurrency, toCurrency];
    
    if (type) {
      query += ` AND b.type = $3`;
      params.push(type);
    }
    
    query += ` ORDER BY 
      CASE WHEN b.type = 'sell' THEN b.exchange_rate ELSE -b.exchange_rate END ASC,
      b.created_at ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Get user's bids
  static async getUserBids(userId, status = null) {
    let query = `SELECT * FROM bids WHERE user_id = $1`;
    const params = [userId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Match bids (mock matching engine)
  static async matchBids(buyBidId, sellBidId, adminId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get both bids
      const buyBid = await client.query(
        `SELECT * FROM bids WHERE id = $1 FOR UPDATE`,
        [buyBidId]
      );
      const sellBid = await client.query(
        `SELECT * FROM bids WHERE id = $1 FOR UPDATE`,
        [sellBidId]
      );
      
      if (!buyBid.rows[0] || !sellBid.rows[0]) {
        throw new Error('Bid not found');
      }
      
      if (buyBid.rows[0].status !== 'open' || sellBid.rows[0].status !== 'open') {
        throw new Error('One or both bids are no longer open');
      }
      
      // Determine match amount (use smaller amount)
      const matchAmount = Math.min(buyBid.rows[0].amount_cents, sellBid.rows[0].amount_cents);
      
      // Update bids
      await client.query(
        `UPDATE bids SET status = $1, matched_bid_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        ['matched', sellBidId, buyBidId]
      );
      await client.query(
        `UPDATE bids SET status = $1, matched_bid_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        ['matched', buyBidId, sellBidId]
      );
      
      // Create mock transaction records for the match
      // (This is mock - no real currency changes hands)
      
      await client.query('COMMIT');
      
      return {
        matched: true,
        buyBid: buyBid.rows[0],
        sellBid: sellBid.rows[0],
        matchAmount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Cancel a bid
  static async cancelBid(bidId, userId) {
    const result = await pool.query(
      `UPDATE bids 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'open'
       RETURNING *`,
      [bidId, userId]
    );
    return result.rows[0];
  }
  
  // Admin cancel any bid
  static async adminCancelBid(bidId, adminId) {
    const result = await pool.query(
      `UPDATE bids 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'open'
       RETURNING *`,
      [bidId]
    );
    
    if (result.rows[0]) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, 'CANCEL_BID', 'bid', bidId, JSON.stringify({})]
      );
    }
    
    return result.rows[0];
  }
}

module.exports = Bid;