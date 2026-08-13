/**
 * Guest donation bonus claim.
 *
 * Guests can donate without an account; their 50% Credon bonus is held in the
 * `donation_bonuses` table (keyed to the donor's email) and credited the first
 * time that email registers or logs in. The bonus is NOT minted until claimed,
 * so unclaimed bonuses never inflate the money supply.
 */
const db = require('../db');
const MockMinting = require('./mockMinting');

async function claimPendingDonationBonuses(email, userId) {
  if (!email || !userId) return 0;

  const pending = await db.query(
    `SELECT id, donation_id, bonus_cents FROM donation_bonuses
      WHERE status = 'pending' AND email = lower($1)
      ORDER BY created_at ASC`,
    [email]
  );

  let claimed = 0;
  for (const b of pending.rows) {
    const bonusCents = parseInt(b.bonus_cents, 10) || 0;
    if (bonusCents <= 0) continue;

    // Mint into the treasury if needed, then distribute to the new account
    let treasury = await MockMinting.getTreasuryBalance();
    if (treasury < bonusCents) {
      await MockMinting.mintToTreasury(bonusCents - treasury, 'Auto-mint for donation bonus claim', null);
    }
    await MockMinting.distributeFromTreasury(userId, bonusCents, '50% donation bonus (claimed)', b.donation_id || b.id);

    await db.query(
      `UPDATE donation_bonuses SET user_id = $1, status = 'claimed', claimed_at = NOW() WHERE id = $2`,
      [userId, b.id]
    );
    claimed++;
  }

  return claimed;
}

module.exports = { claimPendingDonationBonuses };
