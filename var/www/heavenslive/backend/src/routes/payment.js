/**
 * PayPal Payment Routes
 * Redirect flow: HeavensLive → PayPal → HeavensLive
 */
const express = require('express');
const router = express.Router();
const { createPayPalOrder, capturePayPalOrder } = require('../services/paypalService');
const db = require('../db');

/**
 * POST /api/payment/create — Create PayPal order, return redirect URL
 */
router.post('/create', async (req, res) => {
    try {
        const { amount, currency, description, type, orderId } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount required' });

        const result = await createPayPalOrder(amount, currency, description || 'HeavensLive Purchase', orderId, type);
        
        res.json({
            paypalOrderId: result.paypalOrderId,
            approvalUrl: result.approvalUrl,
            usdAmount: result.usdAmount,
            originalAmount: result.originalAmount,
            originalCurrency: result.originalCurrency,
            conversionRate: result.conversionRate,
            isFallback: result.isFallback || false,
            message: result.isFallback ? 'Currency conversion unavailable — using 1:1 rate' : 'Redirect to PayPal to complete payment',
        });
    } catch (error) {
        if (error.message === 'PayPal not configured') {
            return res.json({
                approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/success?orderId=mock-${Date.now()}&type=purchase`,
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
