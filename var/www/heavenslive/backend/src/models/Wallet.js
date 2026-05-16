const pool = require('../config/database');

class Wallet {
  // Get wallet by user ID
  static async getByUserId(userId) {
    const result = await pool.query(
      `SELECT id, user_id, balance_cents, created_at, updated_at 
       FROM wallets WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
  
  // Get balance in base cents
  static async getBalance(userId) {
    const wallet = await this.getByUserId(userId);
    return wallet ? Number(wallet.balance_cents) || 0 : 0;
  }
  
  // Update balance (with transaction record)
  static async updateBalance(userId, amountCents, type, description, referenceId = null, currencyClone = 'Credon-USD') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current wallet
      const walletResult = await client.query(
        `SELECT id, balance_cents FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );
      
      if (!walletResult.rows[0]) {
        throw new Error('Wallet not found');
      }
      
      const walletId = walletResult.rows[0].id;
      const currentBalance = walletResult.rows[0].balance_cents;
      const newBalance = currentBalance + amountCents;
      
      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }
      
      // Update wallet balance
      await client.query(
        `UPDATE wallets SET balance_cents = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newBalance, walletId]
      );
      
      // Record transaction
      const transactionResult = await client.query(
        `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, currency_clone, reference_id, description, is_mock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, transaction_hash, created_at`,
        [userId, type, amountCents, newBalance, currencyClone, referenceId, description, true]
      );
      
      await client.query('COMMIT');
      
      return {
        transaction: transactionResult.rows[0],
        newBalance
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Get transaction history
  static async getTransactionHistory(userId, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, type, amount_cents, balance_after_cents, currency_clone, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1`,
      [userId]
    );
    
    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }
  
  // Get all transactions for ledger (admin, redacted)
  static async getAllTransactions(limit = 200, offset = 0) {
    const result = await pool.query(
      `SELECT t.id, t.type, t.amount_cents, t.currency_clone, t.description, t.created_at,
              CASE 
                WHEN u.is_super_admin = true THEN u.email
                ELSE 'REDACTED_' || LEFT(md5(u.id::text), 8)
              END as user_display
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }
}

module.exports = Wallet;