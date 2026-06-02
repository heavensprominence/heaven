/**
 * Mock Minting Service — Central Treasury Model
 * 
 * All Credon currency is minted into a CENTRAL TREASURY first,
 * then distributed to users via purchases, bonuses, and admin actions.
 * This creates a proper ledger trail and prevents inflation abuse.
 */
const db = require('../db');
const Wallet = require('../models/Wallet');

class MockMinting {
  /**
   * Mint new currency into the CENTRAL TREASURY.
   * No currency enters circulation without going through treasury first.
   */
  static async mintToTreasury(amountCents, reason, adminId = null, currency = 'USD') {
    if (amountCents <= 0) throw new Error('Amount must be positive');

    const result = await db.query(
      `INSERT INTO treasury_ledger (amount_cents, currency, reason, action, admin_id, title)
       VALUES ($1, $2, $3, 'mint', $4, 'Minted Digital Currency') RETURNING *`,
      [amountCents, currency, reason, adminId]
    );

    await db.query(
      `INSERT INTO minting_logs (admin_id, action, amount_cents, reason, is_automatic)
       VALUES ($1, 'mint_to_treasury', $2, $3, false)`,
      [adminId, amountCents, reason]
    );

    return {
      action: 'mint_to_treasury', title: 'Minted Digital Currency',
      amountCents, currency,
      reason,
      treasuryRecord: result.rows[0],
    };
  }

  /**
   * Get current treasury balance (all currencies combined in cents).
   */
  static async getTreasuryBalance() {
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN action = 'mint' THEN amount_cents WHEN action = 'distribute' THEN -amount_cents ELSE 0 END), 0) as balance
      FROM treasury_ledger
    `);
    return parseInt(result.rows[0].balance) || 0;
  }

  /**
   * Distribute currency FROM TREASURY to a user.
   * Used for: bonuses, admin distributions, purchase rewards.
   */
  static async distributeFromTreasury(userId, amountCents, reason, orderId = null, currency = 'USD') {
    if (amountCents <= 0) throw new Error('Amount must be positive');

    const treasuryBalance = await this.getTreasuryBalance();
    if (treasuryBalance < amountCents) {
      throw new Error(`Treasury insufficient: has ${treasuryBalance}, needs ${amountCents}`);
    }

    await db.query(
      `INSERT INTO treasury_ledger (amount_cents, currency, reason, action, admin_id, reference_id, title)
       VALUES ($1, $2, $3, 'distribute', NULL, $4, 'Currency Distribution')`,
      [amountCents, currency, reason, orderId]
    );

    const result = await Wallet.updateBalance(
      userId,
      amountCents,
      'mint',
      reason,
      orderId
    );

    return {
      action: 'distribute',
      userId,
      amountCents,
      currency,
      reason,
      newBalance: result.newBalance,
    };
  }

  static async distributeBonus(userId, purchaseAmountUSD, purchaseNumber, orderId) {
    const BonusCalculator = require('./bonusCalculator');
    const bonus = BonusCalculator.calculateBonus(purchaseAmountUSD, purchaseNumber);

    if (bonus.bonusCents > 0) {
      return await this.distributeFromTreasury(
        userId,
        bonus.bonusCents,
        `Auto bonus for purchase #${purchaseNumber}: ${bonus.multiplier}x multiplier`,
        orderId,
        'USD'
      );
    }
    return null;
  }

  static async burnFromUser(userId, amountCents, reason, adminId = null) {
    if (amountCents <= 0) throw new Error('Amount must be positive');

    const currentBalance = await Wallet.getBalance(userId);
    if (currentBalance < amountCents) {
      throw new Error(`Insufficient balance. Has ${currentBalance}, needs ${amountCents}`);
    }

    await Wallet.updateBalance(userId, -amountCents, 'burn', `Burn: ${reason}`, null);

    await db.query(
      `INSERT INTO treasury_ledger (amount_cents, currency, reason, action, admin_id, title)
       VALUES ($1, 'USD', $2, 'burn_return', $3, 'Burned Digital Currency')`,
      [amountCents, reason, adminId]
    );

    await db.query(
      `INSERT INTO minting_logs (admin_id, action, amount_cents, reason, is_automatic)
       VALUES ($1, 'burn', $2, $3, false)`,
      [adminId, amountCents, reason]
    );

    return { userId, amountCents, reason };
  }

  static async getCirculatingSupply() {
    const result = await db.query(`SELECT SUM(balance_cents) as total FROM wallets`);
    return parseInt(result.rows[0].total_cents) || 0;
  }

  static async getTreasurySummary() {
    const minted = await db.query(
      `SELECT COALESCE(SUM(amount_cents), 0) as total FROM treasury_ledger WHERE action = 'mint'`
    );
    const distributed = await db.query(
      `SELECT COALESCE(SUM(amount_cents), 0) as total FROM treasury_ledger WHERE action = 'distribute'`
    );
    const returned = await db.query(
      `SELECT COALESCE(SUM(amount_cents), 0) as total FROM treasury_ledger WHERE action = 'burn_return'`
    );

    return {
      total_minted: parseInt(minted.rows[0].total),
      total_distributed: parseInt(distributed.rows[0].total),
      total_burned_returned: parseInt(returned.rows[0].total),
      treasury_balance: await this.getTreasuryBalance(),
      circulating_supply: await this.getCirculatingSupply(),
    };
  }
}

module.exports = MockMinting;
