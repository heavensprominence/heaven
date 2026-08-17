/**
 * User Cleanup Service
 * Deletes unverified accounts older than N days to prevent bot table pollution.
 * Bots register but never verify email; real users verify quickly.
 */
const pool = require('../db');

const UNVERIFIED_GRACE_DAYS = 7;

async function cleanupUnverifiedUsers() {
  try {
    // Find unverified accounts older than the grace period
    const stale = await pool.query(
      `SELECT id, email FROM users 
       WHERE email_verified = false 
       AND created_at < NOW() - INTERVAL '${UNVERIFIED_GRACE_DAYS} days'
       AND is_super_admin = false`
    );

    if (stale.rows.length === 0) {
      return { deleted: 0 };
    }

    let reversedBonuses = 0;
    for (const u of stale.rows) {
      // Defensively reverse any signup bonus (shouldn't exist for unverified, but be safe)
      const rev = await pool.query(
        "UPDATE treasury_ledger SET amount_cents = -amount_cents, reason = 'Reversed: unverified account purge', action = 'burn_return' WHERE action = 'signup_bonus' AND reference_id = $1",
        [u.id]
      );
      reversedBonuses += rev.rowCount;

      // Delete user (cascades to wallets, wallet_balances, etc.)
      await pool.query("DELETE FROM users WHERE id = $1", [u.id]);
    }

    console.log(`🧹 Cleanup: purged ${stale.rows.length} unverified accounts (${reversedBonuses} bonuses reversed)`);
    return { deleted: stale.rows.length, reversedBonuses };
  } catch (e) {
    console.error('User cleanup error:', e.message);
    return { deleted: 0, error: e.message };
  }
}

module.exports = { cleanupUnverifiedUsers, UNVERIFIED_GRACE_DAYS };
