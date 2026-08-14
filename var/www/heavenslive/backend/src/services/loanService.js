/**
 * Loan interest & repayment model.
 *
 * Interest is an ANNUAL percentage rate (APR), accrued DAILY on the outstanding principal.
 * Simple interest (no compounding): dailyRate = APR / 100 / 365; each day adds principal × dailyRate.
 * Negative APRs are supported — the outstanding balance shrinks each day (interest credit).
 * Borrowers may pay any amount at any time; interest is settled first, then principal.
 */
const db = require('../db');
const Wallet = require('../models/Wallet');

function dailyRate(apr) {
  return (parseFloat(apr) || 0) / 100 / 365;
}

function daysSince(ts, now) {
  return Math.max(0, (now.getTime() - new Date(ts).getTime()) / 86400000);
}

/**
 * Materialize daily accrual and return the current loan state.
 * Returns null if the loan doesn't exist.
 */
async function getLoanState(activeLoanId) {
  const lr = await db.query('SELECT * FROM active_loans WHERE id = $1', [activeLoanId]);
  if (lr.rows.length === 0) return null;
  const loan = lr.rows[0];

  const acc = await db.query('SELECT * FROM loan_accruals WHERE active_loan_id = $1', [activeLoanId]);
  const a = acc.rows[0];

  const now = new Date();
  const principal = parseInt(loan.remaining_cents, 10) || 0;
  const baseAccrued = a ? (parseInt(a.accrued_interest_cents, 10) || 0) : 0;
  const lastCalc = a ? new Date(a.last_interest_calc) : (new Date(loan.start_date) || now);
  const days = daysSince(lastCalc, now);
  const dr = dailyRate(loan.interest_rate);
  const delta = Math.round(principal * dr * days);
  const accrued = baseAccrued + delta;

  if (a) {
    await db.query(
      'UPDATE loan_accruals SET accrued_interest_cents = $1, last_interest_calc = NOW(), updated_at = NOW() WHERE active_loan_id = $2',
      [accrued, activeLoanId]
    );
  } else {
    await db.query(
      'INSERT INTO loan_accruals (active_loan_id, accrued_interest_cents, last_interest_calc) VALUES ($1, $2, NOW())',
      [activeLoanId, accrued]
    );
  }

  return {
    loan,
    principalCents: principal,
    accruedInterestCents: accrued,
    totalOwedCents: Math.max(0, principal + accrued),
    dailyRate: dr,
    annualRatePercent: parseFloat(loan.interest_rate) || 0,
    daysSinceLastCalc: days,
  };
}

/**
 * Pure function: apply a payment (interest first, then principal).
 * Handles negative interest as a principal reduction.
 */
function applyPayment(principalCents, accruedInterestCents, amountCents) {
  const totalOwed = Math.max(0, principalCents + accruedInterestCents);
  const effective = Math.min(amountCents, totalOwed);
  const excess = amountCents - effective;

  let interestPaid = 0;
  let principalPaid = 0;
  if (accruedInterestCents > 0) {
    interestPaid = Math.min(accruedInterestCents, effective);
    principalPaid = effective - interestPaid;
  } else {
    principalPaid = effective; // negative/zero interest is absorbed into principal
  }

  const newPrincipal = Math.max(0, principalCents - principalPaid + Math.min(0, accruedInterestCents));
  const newAccrued = Math.max(0, accruedInterestCents - interestPaid);

  return { principalPaid, interestPaid, newPrincipal, newAccrued, effective, excess };
}

/**
 * Full repayment flow. `via` is 'wallet' (Credon balance) or 'paypal' (already paid via PayPal).
 */
async function processRepayment(activeLoanId, amountCents, via = 'wallet') {
  const state = await getLoanState(activeLoanId);
  if (!state) throw new Error('Loan not found');
  const { loan } = state;

  const { principalPaid, interestPaid, newPrincipal, newAccrued, effective, excess } =
    applyPayment(state.principalCents, state.accruedInterestCents, amountCents);

  if (excess > 0) {
    const err = new Error('Payment exceeds amount owed');
    err.code = 'OVERPAYMENT';
    err.totalOwedCents = state.totalOwedCents;
    throw err;
  }

  const currency = loan.currency || 'USD';

  if (via === 'wallet') {
    await Wallet.updateBalance(
      loan.user_id,
      -effective,
      'loan_repayment',
      `Loan repayment: $${(principalPaid / 100).toFixed(2)} principal + $${(interestPaid / 100).toFixed(2)} interest`,
      null,
      currency
    );
  }

  // Burn the repaid amount out of circulation
  await db.query(
    `INSERT INTO treasury_ledger (amount_cents, currency, reason, action, title)
     VALUES ($1, $2, 'Loan repayment', 'burn_return', 'Loan Repayment')`,
    [effective, currency]
  );

  await db.query(
    'INSERT INTO loan_repayments (active_loan_id, user_id, amount_cents, principal_paid_cents, interest_paid_cents) VALUES ($1, $2, $3, $4, $5)',
    [activeLoanId, loan.user_id, effective, principalPaid, interestPaid]
  );

  if (newPrincipal <= 0) {
    await db.query("UPDATE active_loans SET remaining_cents = 0, status = 'repaid' WHERE id = $1", [activeLoanId]);
    await db.query('DELETE FROM loan_accruals WHERE active_loan_id = $1', [activeLoanId]);
  } else {
    await db.query('UPDATE active_loans SET remaining_cents = $1 WHERE id = $2', [newPrincipal, activeLoanId]);
    await db.query(
      'UPDATE loan_accruals SET accrued_interest_cents = $1, last_interest_calc = NOW(), updated_at = NOW() WHERE active_loan_id = $2',
      [newAccrued, activeLoanId]
    );
  }

  return {
    principalPaid,
    interestPaid,
    effective,
    newPrincipal,
    newAccrued,
    status: newPrincipal <= 0 ? 'repaid' : 'active',
  };
}

module.exports = { dailyRate, daysSince, getLoanState, applyPayment, processRepayment };
