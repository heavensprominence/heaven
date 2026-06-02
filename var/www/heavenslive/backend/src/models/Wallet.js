/**
 * Wallet Model — Multi-Currency
 * Each user can hold balances in multiple currencies.
 */
const pool = require('../db');

class Wallet {
  /**
   * Get all balances for a user, keyed by currency.
   * Returns { USD: 50000, EUR: 50000, ... }
   */
  static async getBalances(userId) {
    const result = await pool.query(
      "SELECT currency, balance_cents FROM wallet_balances WHERE user_id = $1",
      [userId]
    );
    const balances = {};
    result.rows.forEach(r => { balances[r.currency] = parseInt(r.balance_cents); });
    return balances;
  }

  /**
   * Get balance for a specific currency (defaults to USD if wallet not found).
   */
  static async getBalance(userId, currency = 'USD') {
    const result = await pool.query(
      "SELECT balance_cents FROM wallet_balances WHERE user_id = $1 AND currency = $2",
      [userId, currency]
    );
    return result.rows.length > 0 ? parseInt(result.rows[0].balance_cents) : 0;
  }

  /**
   * Get total balance in USD equivalent across all currencies.
   */
  static async getTotalBalanceUsd(userId) {
    const balances = await this.getBalances(userId);
    const rates = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.37, AUD: 1.53, KES: 130, NGN: 1550, INR: 83.5, JPY: 155, CNY: 7.24, ZAR: 18.5 };
    let total = 0;
    for (const [cur, cents] of Object.entries(balances)) {
      const rate = rates[cur] || 1;
      total += Math.round(cents / rate);
    }
    return total;
  }

  /**
   * Update balance for a specific currency.
   */
  static async updateBalance(userId, amountCents, type, description, referenceId = null, currency = 'USD') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ensure wallet_balance row exists for this currency
      await client.query(
        "INSERT INTO wallet_balances (user_id, currency, balance_cents) VALUES ($1, $2, 0) ON CONFLICT (user_id, currency) DO NOTHING",
        [userId, currency]
      );
      
      // Get current balance with row lock
      const walletResult = await client.query(
        "SELECT balance_cents FROM wallet_balances WHERE user_id = $1 AND currency = $2 FOR UPDATE",
        [userId, currency]
      );
      
      const currentBalance = parseInt(walletResult.rows[0].balance_cents);
      const newBalance = currentBalance + amountCents;
      
      if (newBalance < 0) {
        throw new Error(`Insufficient ${currency} balance. Has ${currentBalance}, needs ${Math.abs(amountCents)}`);
      }
      
      await client.query(
        "UPDATE wallet_balances SET balance_cents = $1, updated_at = NOW() WHERE user_id = $2 AND currency = $3",
        [newBalance, userId, currency]
      );
      
      // Record transaction with currency
      await client.query(
        `INSERT INTO transactions (user_id, type, amount_cents, balance_after_cents, currency_clone, description, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, type, amountCents, newBalance, currency, description, referenceId]
      );
      
      await client.query('COMMIT');
      return { currency, newBalance, amountCents };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Get all transactions (for public ledger / user history).
   */
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

  /**
   * Get transactions for a specific user.
   */
  static async getUserTransactions(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );
    return result.rows;
  }
}

module.exports = Wallet;
