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
    const balanceCents = await Wallet.getBalance(req.userId);
    const wallet = await Wallet.getByUserId(req.userId);
    
    // Get supported currencies for conversion
    const currencies = await ExchangeRates.getSupportedCurrencies();
    
    // Calculate balance in all currencies (live rates)
    const balances = {};
    for (const currency of currencies) {
      try {
        const converted = await ExchangeRates.convert(balanceCents / 100, 'Credon-USD', currency);
        balances[currency] = converted;
      } catch (err) {
        balances[currency] = null;
      }
    }
    
    // Get purchase count and bonus info
    const purchaseResult = await db.query('SELECT 0 as purchase_count FROM users WHERE id = $1', [req.userId]);
    const purchaseCount = parseInt(purchaseResult.rows[0]?.purchase_count) || 0;
    const BonusCalculator = require('../services/bonusCalculator');
    const bonus = BonusCalculator.getBonusMultiplier(purchaseCount + 1);
    
    res.json({
      balance_cents: balanceCents,
      balance_usd: balanceCents / 100,
      wallet,
      balances,
      purchase_count: purchaseCount,
      next_purchase: purchaseCount + 1,
      bonus_multiplier: bonus,
      bonus_label: bonus + '×',
      supported_currencies: currencies,
      testing_disclaimer: "THIS IS A TESTING SYSTEM ONLY. No real currency or financial instruments are being offered."
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET transaction history
router.get('/transactions', verifyToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    const history = await Wallet.getTransactionHistory(req.userId, limit, offset);
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
router.get('/loans', verifyToken, async (req, res) => {
    try {
        const loans = await db.query(
            `SELECT al.*, lr.type as loan_type FROM active_loans al
             LEFT JOIN loan_requests lr ON al.loan_request_id = lr.id
             WHERE al.user_id = $1 AND al.status = 'active' ORDER BY al.created_at DESC`,
            [req.userId]
        );
        
        // Calculate accrued interest for each loan
        const now = new Date();
        const enriched = loans.rows.map(loan => {
            const daysSinceLastCalc = Math.max(0, (now - new Date(loan.last_interest_calc)) / 86400000);
            const dailyRate = (loan.interest_rate / 100) / 365;
            const accruedInterest = Math.round(loan.remaining_cents * dailyRate * daysSinceLastCalc);
            return {
                ...loan,
                accrued_interest_cents: accruedInterest,
                total_owing_cents: loan.remaining_cents + accruedInterest,
                days_active: Math.ceil((now - new Date(loan.start_date)) / 86400000)
            };
        });
        
        res.json({ loans: enriched });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/loans/:id/repay', verifyToken, async (req, res) => {
    try {
        const { amount_cents } = req.body;
        if (!amount_cents || amount_cents <= 0) return res.status(400).json({ error: 'Positive amount required' });
        
        const loan = await db.query('SELECT * FROM active_loans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        
        const l = loan.rows[0];
        const now = new Date();
        
        // Calculate accrued interest
        const daysSinceLastCalc = Math.max(0, (now - new Date(l.last_interest_calc)) / 86400000);
        const dailyRate = (l.interest_rate / 100) / 365;
        const accruedInterest = Math.round(l.remaining_cents * dailyRate * daysSinceLastCalc);
        
        // Check balance
        const balance = await Wallet.getBalance(req.userId);
        if (balance < amount_cents) return res.status(400).json({ error: 'Insufficient balance' });
        
        // Apply payment: interest first, then principal
        let interestPaid = 0, principalPaid = 0;
        let remaining = amount_cents;
        
        if (accruedInterest > 0 && remaining > 0) {
            interestPaid = Math.min(accruedInterest, remaining);
            remaining -= interestPaid;
        }
        if (remaining > 0) {
            principalPaid = Math.min(l.remaining_cents, remaining);
            remaining -= principalPaid;
        }
        
        // Deduct from wallet
        await Wallet.updateBalance(req.userId, -amount_cents, 'loan_repayment',
            `Loan repayment: $${(principalPaid/100).toFixed(2)} principal + $${(interestPaid/100).toFixed(2)} interest`);
        
        // Return to treasury
        await db.query('INSERT INTO treasury_ledger (amount_cents, reason, action, title) VALUES ($1, $2, $3, $4)',
            [amount_cents, 'Loan repayment', 'burn_return', 'Loan Repayment']);
        
        // Record repayment
        await db.query('INSERT INTO loan_repayments (active_loan_id, user_id, amount_cents, principal_paid_cents, interest_paid_cents) VALUES ($1, $2, $3, $4, $5)',
            [l.id, req.userId, amount_cents, principalPaid, interestPaid]);
        
        // Update loan balance
        const newRemaining = l.remaining_cents - principalPaid;
        if (newRemaining <= 0) {
            await db.query("UPDATE active_loans SET remaining_cents = 0, status = 'repaid', last_interest_calc = NOW() WHERE id = $1", [l.id]);
        } else {
            await db.query('UPDATE active_loans SET remaining_cents = $1, last_interest_calc = NOW() WHERE id = $2', [newRemaining, l.id]);
        }
        
        res.json({
            success: true,
            principal_paid: principalPaid / 100,
            interest_paid: interestPaid / 100,
            total_paid: amount_cents / 100,
            remaining: newRemaining / 100,
            status: newRemaining <= 0 ? 'repaid' : 'active'
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Repay loan — any amount, any time
router.post('/loans/:id/repay', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const amt = parseFloat(amount);
        
        if (!amt || amt <= 0) return res.status(400).json({ error: 'Amount required' });
        
        const loan = await db.query('SELECT * FROM active_loans WHERE id = $1 AND user_id = $2', [id, req.userId]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        
        const l = loan.rows[0];
        const days = Math.max(1, Math.ceil((Date.now() - new Date(l.start_date).getTime()) / 86400000));
        const dailyRate = l.interest_rate_percent / 100 / 365;
        const interestAccrued = Math.round(l.principal_cents * dailyRate * days);
        const totalOwed = l.principal_cents + interestAccrued;
        const repayCents = Math.min(Math.round(amt * 100), l.remaining_cents + interestAccrued);
        
        // Check wallet balance
        const wallet = await db.query('SELECT balance_cents FROM wallets WHERE user_id = $1', [req.userId]);
        if ((wallet.rows[0]?.balance_cents || 0) < repayCents) {
            return res.status(402).json({ error: 'Insufficient balance', needed: repayCents });
        }
        
        // Deduct from wallet
    await db.query('UPDATE wallets SET balance_cents = balance_cents - $1 WHERE user_id = $2', [repayCents, req.userId]);
    // Burn the principal portion (returned to treasury → burned out of existence)
    try{await db.query("INSERT INTO treasury_ledger (amount_cents, reason, action, admin_id, title) VALUES ($1, $2, 'burn', $3, $4)",[repayCents,'Loan principal repayment burned',req.userId,'Loan Repayment Burn'])}catch(e){}
        
        const newRemaining = Math.max(0, l.remaining_cents - repayCents);
        await db.query('UPDATE active_loans SET remaining_cents = $1, last_payment_at = NOW(), interest_accrued_cents = COALESCE(interest_accrued_cents,0) + $2 WHERE id = $3', [newRemaining, interestAccrued, id]);
        
        await db.query(
            "INSERT INTO loan_repayments (active_loan_id, user_id, amount_cents, interest_cents) VALUES ($1, $2, $3, $4)",
            [id, req.userId, repayCents, interestAccrued]
        );
        
        await db.query(
            "INSERT INTO transactions (user_id, amount_cents, type, description) VALUES ($1, $2, 'debit', $3)",
            [req.userId, -repayCents, 'Loan repayment']
        );
        
        res.json({ success: true, remaining: newRemaining, repaid: repayCents, interest: interestAccrued });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;