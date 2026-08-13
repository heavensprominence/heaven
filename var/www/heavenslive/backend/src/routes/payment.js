/**
 * PayPal Payment Routes
 * Redirect flow: HeavensLive → PayPal → HeavensLive
 */
const express = require('express');
const router = express.Router();
const { createPayPalOrder, capturePayPalOrder } = require('../services/paypalService');
const { optionalAuth } = require('../middleware/auth');
const db = require('../db');

/**
 * Complete a donation after the PayPal redirect: capture the order and credit the 50% bonus.
 */
async function completeDonation(donationId, paypalOrderId) {
  const found = await db.query('SELECT * FROM donations WHERE id = $1', [donationId]);
  const donation = found.rows[0];
  if (!donation || donation.status === 'completed') return; // missing or already credited (idempotent)

  // Confirm payment by capturing the PayPal order (when we have a real order id)
  if (paypalOrderId) {
    try {
      await capturePayPalOrder(paypalOrderId);
    } catch (error) {
      if (error.message === 'PayPal not configured') {
        // Sandbox/test without PayPal — treat the redirect as paid
      } else {
        console.error('Donation PayPal capture failed:', error.message);
        return; // payment not confirmed — do not credit
      }
    }
  }

  await db.query(`UPDATE donations SET status = 'completed' WHERE id = $1`, [donationId]);

  // Credit the 50% Credon bonus to authenticated donors
  if (donation.user_id) {
    const BonusCalculator = require('../services/bonusCalculator');
    const MockMinting = require('../services/mockMinting');
    const amountUSD = (parseInt(donation.amount_cents, 10) || 0) / 100;
    const bonus = BonusCalculator.calculateDonationBonus(amountUSD);
    if (bonus.bonusCents > 0) {
      let treasury = await MockMinting.getTreasuryBalance();
      if (treasury < bonus.bonusCents) {
        await MockMinting.mintToTreasury(bonus.bonusCents - treasury, 'Auto-mint for donation bonus', null);
      }
      await MockMinting.distributeFromTreasury(donation.user_id, bonus.bonusCents, '50% donation bonus', donationId);
    }
  }
}

/**
 * POST /api/payment/create — Create PayPal order, return redirect URL
 */
router.post('/create', optionalAuth, async (req, res) => {
    let finalOrderId = req.body.orderId;
    try {
        const { amount, currency, description, type } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount required' });

        // Record donations up-front so the 50% bonus can be credited after payment
        if (type === 'donation') {
            const donation = await db.query(
                `INSERT INTO donations (user_id, amount_cents, currency, status)
                 VALUES ($1, $2, $3, 'pending_payment') RETURNING id`,
                [req.userId || null, Math.round(Number(amount) * 100), currency || 'USD']
            );
            finalOrderId = donation.rows[0].id;
        }

        const result = await createPayPalOrder(amount, currency, description || 'HeavensLive Purchase', finalOrderId, type);
        
        res.json({
            paypalOrderId: result.paypalOrderId,
            approvalUrl: result.approvalUrl,
            usdAmount: result.usdAmount,
            originalAmount: result.originalAmount,
            originalCurrency: result.originalCurrency,
            conversionRate: result.conversionRate,
            isFallback: result.isFallback || false,
            orderId: finalOrderId,
            message: result.isFallback ? 'Currency conversion unavailable — using 1:1 rate' : 'Redirect to PayPal to complete payment',
        });
    } catch (error) {
        if (error.message === 'PayPal not configured') {
            return res.json({
                approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/success?orderId=${finalOrderId || 'mock-' + Date.now()}&type=${req.body.type || 'purchase'}&amount=${req.body.amount}&origAmount=${req.body.amount}&origCurrency=${req.body.currency || 'USD'}`,
                orderId: finalOrderId,
                message: 'PayPal not configured — using mock redirect',
            });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /payment/success — User returns from PayPal after successful payment
 */
router.get('/success', async (req, res) => {
    const { orderId, type, token, amount, origAmount, origCurrency } = req.query;

    // Complete donations: capture the PayPal order and credit the 50% bonus
    if (type === 'donation' && orderId) {
        try {
            await completeDonation(orderId, token);
        } catch (error) {
            console.error('Donation completion error:', error.message);
        }
    }

    res.send(`<!DOCTYPE html><html><head><title>Payment Successful</title>
<style>body{font-family:system-ui;background:#0F0F1A;color:#E8E6E3;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}
.card{background:#16213E;padding:48px;border-radius:16px;border:1px solid rgba(200,169,81,0.3);max-width:500px}
h1{color:#2ECC71;font-size:2rem;margin-bottom:8px}p{color:#A0A0B0;margin:12px 0}
.btn{display:inline-block;background:#C8A951;color:#0F0F1A;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px}</style></head>
<body><div class="card">
  <div style="font-size:4rem">✅</div>
  <h1>Payment Successful!</h1>
  <p>Your ${type || 'purchase'} has been confirmed.</p>
  <p style="font-size:0.85rem">Order ID: ${orderId || 'N/A'}${origCurrency && origCurrency !== "USD" ? `<br><span style="font-size:0.8rem;color:#A0A0B0">${origAmount} ${origCurrency} → $${amount} USD</span>` : ""}</p>
  <a href="/credon/wallet" class="btn">Go to Wallet</a>
  <a href="/" class="btn" style="background:transparent;border:1px solid #C8A951;color:#C8A951">Home</a>
</div></body></html>`);
});

/**
 * GET /payment/cancel — User cancels on PayPal
 */
router.get('/cancel', async (req, res) => {
    const { orderId, type } = req.query;
    
    res.send(`<!DOCTYPE html><html><head><title>Payment Cancelled</title>
<style>body{font-family:system-ui;background:#0F0F1A;color:#E8E6E3;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}
.card{background:#16213E;padding:48px;border-radius:16px;border:1px solid rgba(231,76,60,0.3);max-width:500px}
h1{color:#E74C3C;font-size:2rem;margin-bottom:8px}p{color:#A0A0B0;margin:12px 0}
.btn{display:inline-block;background:#C8A951;color:#0F0F1A;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px}</style></head>
<body><div class="card">
  <div style="font-size:4rem">❌</div>
  <h1>Payment Cancelled</h1>
  <p>Your ${type || 'purchase'} was not completed. No charges were made.</p>
  <a href="/credon/wallet" class="btn">Try Again</a>
  <a href="/" class="btn" style="background:transparent;border:1px solid #C8A951;color:#C8A951">Home</a>
</div></body></html>`);
});

/**
 * POST /api/payment/capture — Capture PayPal order (webhook/internal)
 */
router.post('/capture', async (req, res) => {
    try {
        const { paypalOrderId } = req.body;
        if (!paypalOrderId) return res.status(400).json({ error: 'paypalOrderId required' });
        
        const capture = await capturePayPalOrder(paypalOrderId);
        res.json({ success: true, capture });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
