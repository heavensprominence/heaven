const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const ExchangeRates = require('../services/exchangeRateService');
const db = require('../db');
const { getDenominationBreakdown, formatCurrencyAmount, ALL_DENOMINATIONS } = require('../services/denominations');

// GET currency denominations (paper/coin designs)
router.get('/denominations', async (req, res) => {
    try {
        const currencies = Object.keys(ALL_DENOMINATIONS);
        const result = {};
        for (const currency of currencies) {
            result[currency] = {
                ...ALL_DENOMINATIONS[currency],
                // Generate breakdown for key reference amounts
                examples: {
                   small: getDenominationBreakdown(10, currency),
                   medium: getDenominationBreakdown(100, currency),
                   large: getDenominationBreakdown(1000, currency),
                }
            };
        }
        res.json({ denominations: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET amount broken down into bills/coins
router.get('/denominations/:currency/:amount', async (req, res) => {
    try {
        const { currency, amount } = req.params;
        const breakdown = getDenominationBreakdown(parseFloat(amount), currency.toUpperCase());
        if (!breakdown) return res.status(404).json({ error: 'Currency not supported' });
        res.json(breakdown);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const SystemSettings = require('../services/systemSettings');

// GET wallet balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const perCurrency = await Wallet.getBalances(req.userId);
    const balanceUsd = await Wallet.getTotalBalanceUsd(req.userId);
    const purchaseResult = await db.query('SELECT 0 as purchase_count FROM users WHERE id = $1', [req.userId]);
    const purchaseCount = parseInt(purchaseResult.rows[0]?.purchase_count) || 0;
    const BonusCalculator = require('../services/bonusCalculator');
    const bonus = BonusCalculator.getBonusMultiplier(purchaseCount + 1);
    res.json({
      balance_cents: balanceUsd,
      balance_usd: balanceUsd / 100,
      per_currency: perCurrency,
      purchase_count: purchaseCount,
      next_purchase: purchaseCount + 1,
      bonus_multiplier: bonus,
      bonus_label: bonus + '\u00d7',
      testing_disclaimer: "THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered."
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/transactions', verifyToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    const history = await Wallet.getUserTransactions(req.userId, limit, offset);
    res.json(history);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET global ledger (redacted for privacy)
router.get('/ledger', verifyToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    const transactions = await Wallet.getAllTransactions(limit, offset);
    res.json({
      transactions,
      total: transactions.length,
      testing_disclaimer: "THIS IS A TESTING SYSTEM ONLY. User information is redacted for privacy."
    });
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET exchange rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const baseCurrency = req.query.base || 'Credon-USD';
    const rates = await ExchangeRates.getAllRates(baseCurrency);
    const currencies = await ExchangeRates.getSupportedCurrencies();
    
    res.json({
      base: baseCurrency,
      rates,
      currencies,
      updated_at: new Date().toISOString(),
      disclaimer: "Exchange rates update every 5 minutes from live market data."
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CONVERT amount (mock)
router.get('/convert', async (req, res) => {
  const { amount, from, to } = req.query;
  
  if (!amount || !from || !to) {
    return res.status(400).json({ error: 'Missing required parameters: amount, from, to' });
  }
  
  try {
    const convertedAmount = await ExchangeRates.convert(parseFloat(amount), from, to);
    const rate = await ExchangeRates.getRate(from, to);
    
    res.json({
      from,
      to,
      amount: parseFloat(amount),
      converted_amount: convertedAmount,
      rate,
      disclaimer: "Rates update every 5 minutes from live market data."
    });
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/wallet/send — Transfer Credon to another user (ALWAYS allowed)
router.post('/send', verifyToken, async (req, res) => {
    try {
        const { toEmail, amount, currency } = req.body;
        if (!toEmail || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Recipient email and positive amount required' });
        }
        
        // Find recipient
        const recipient = await db.query('SELECT id FROM users WHERE email = $1', [toEmail]);
        if (recipient.rows.length === 0) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        
        const recipientId = recipient.rows[0].id;
        const amountCents = Math.round(amount * 100);
        
        // Check sender balance
        const senderBalance = await Wallet.getBalance(req.userId);
        if (senderBalance < amountCents) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Transfer
        await Wallet.updateBalance(req.userId, -amountCents, 'transfer_sent', `Sent to ${toEmail}`, null);
        await Wallet.updateBalance(recipientId, amountCents, 'transfer_received', `Received from user`, null);
        
        res.json({ success: true, amount: amountCents / 100, to: toEmail });
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/wallet/withdraw — External withdrawal (🔒 GATED)
router.post('/withdraw', verifyToken, async (req, res) => {
    try {
        await SystemSettings.assertWithdrawalsEnabled();
        
        const { amount, currency, destination } = req.body; // destination = bank/crypto address
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount required' });
        }
        
        // Withdrawal logic would go here (bank transfer, crypto send, etc.)
        // For now: blocked by default until system matures
        
        res.json({ success: true, message: 'Withdrawal request submitted for review' });
    } catch (error) {
        if (error.message === 'WITHDRAWALS_DISABLED') {
            return res.status(403).json({ 
                error: 'withdrawals_disabled',
                message: error.userMessage 
            });
        }
        console.error('Withdraw error:', error);
        res.status(500).json({ error: error.message });
    }
});


// === LOAN MANAGEMENT ===
const loanService = require('../services/loanService');

// GET /loans — list active loans with live daily accrual
router.get('/loans', verifyToken, async (req, res) => {
    try {
        const loans = await db.query(
            `SELECT al.*, lr.type as loan_type FROM active_loans al
             LEFT JOIN loan_requests lr ON al.loan_request_id = lr.id
             WHERE al.user_id = $1 AND al.status = 'active' ORDER BY al.created_at DESC`,
            [req.userId]
        );

        const enriched = [];
        for (const loan of loans.rows) {
            const state = await loanService.getLoanState(loan.id);
            enriched.push({
                ...loan,
                accrued_interest_cents: state.accruedInterestCents,
                total_owing_cents: state.totalOwedCents,
                daily_rate: state.dailyRate,
                annual_rate_percent: state.annualRatePercent,
                days_active: Math.ceil(loanService.daysSince(loan.start_date, new Date())),
            });
        }
        res.json({ loans: enriched });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /loans — apply for a loan (admin approves with an amount + annual rate)
router.post('/loans', verifyToken, async (req, res) => {
    try {
        const { amount, reason, currency } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount required' });
        const amountCents = Math.round(amount * 100);
        const result = await db.query(
            `INSERT INTO loan_requests (user_id, amount_requested, currency, admin_notes, status, created_at)
             VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
            [req.userId, amountCents, currency || 'Credon-USD', reason || '']
        );
        res.json({ success: true, loan: result.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /loans/:id — single loan detail with live accrual
router.get('/loans/:id', verifyToken, async (req, res) => {
    try {
        const loan = await db.query('SELECT * FROM active_loans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        const state = await loanService.getLoanState(req.params.id);
        res.json({
            ...loan.rows[0],
            accrued_interest_cents: state.accruedInterestCents,
            total_owing_cents: state.totalOwedCents,
            daily_rate: state.dailyRate,
            annual_rate_percent: state.annualRatePercent,
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /loans/:id/payoff — exact payoff quote (annual rate, daily accrual)
router.get('/loans/:id/payoff', verifyToken, async (req, res) => {
    try {
        const loan = await db.query('SELECT * FROM active_loans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        const state = await loanService.getLoanState(req.params.id);
        res.json({
            principal_cents: state.principalCents,
            accrued_interest_cents: state.accruedInterestCents,
            total_owed_cents: state.totalOwedCents,
            annual_rate_percent: state.annualRatePercent,
            daily_rate: state.dailyRate,
            days_since_last_calc: state.daysSinceLastCalc,
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /loans/:id/repayments — repayment history
router.get('/loans/:id/repayments', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM loan_repayments WHERE active_loan_id = $1 AND user_id = $2 ORDER BY created_at DESC',
            [req.params.id, req.userId]
        );
        res.json({ repayments: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /loans/:id/repay — any amount, any time; Credon wallet or PayPal
router.post('/loans/:id/repay', verifyToken, async (req, res) => {
    try {
        const { amount, method = 'credon_wallet' } = req.body;
        const amountCents = Math.round(parseFloat(amount) * 100);
        if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'Positive amount required' });

        const loan = await db.query('SELECT * FROM active_loans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

        if (method === 'paypal') {
            // Create a PayPal order; the repayment is applied on the success callback.
            const { createPayPalOrder } = require('../services/paypalService');
            const intent = await db.query(
                `INSERT INTO loan_repayment_intents (active_loan_id, user_id, amount_cents, status)
                 VALUES ($1, $2, $3, 'pending') RETURNING id`,
                [req.params.id, req.userId, amountCents]
            );
            const result = await createPayPalOrder(amount, 'USD', 'Loan repayment', intent.rows[0].id, 'loan_repayment');
            return res.json({
                success: true,
                paypalOrderId: result.paypalOrderId,
                approvalUrl: result.approvalUrl,
                orderId: intent.rows[0].id,
                message: 'Redirect to PayPal to complete the repayment',
            });
        }

        // Credon wallet repayment (default)
        const outcome = await loanService.processRepayment(req.params.id, amountCents, 'wallet');
        res.json({
            success: true,
            principal_paid: outcome.principalPaid / 100,
            interest_paid: outcome.interestPaid / 100,
            total_paid: outcome.effective / 100,
            remaining: outcome.newPrincipal / 100,
            status: outcome.status,
        });
    } catch (error) {
        if (error.code === 'OVERPAYMENT') {
            return res.status(400).json({ error: error.message, total_owed_cents: error.totalOwedCents });
        }
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;