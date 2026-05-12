/**
 * Landing Page Routes — Donations & USB Prayer Purchases
 * Public-facing, no auth required for guest flow.
 * Purchases count toward Credon bonuses for authenticated users.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { sendBuyerSaleConfirmation } = require('../services/emailService');
const crypto = require('crypto');

// === DONATIONS ===

// POST /api/landing/donate — Guest or authenticated donation
router.post('/donate', async (req, res) => {
    try {
        const { amount_cents, currency = 'USD', name, email, message, anonymous = false } = req.body;
        
        if (!amount_cents || amount_cents < 100) {
            return res.status(400).json({ error: 'Minimum donation is $1.00' });
        }
        
        const userId = req.userId || null;
        const donationToken = userId ? null : crypto.randomBytes(16).toString('hex');
        
        const result = await db.query(
            `INSERT INTO donations (user_id, amount_cents, currency, donor_name, donor_email, message, anonymous, guest_token, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_payment')
             RETURNING id, guest_token`,
            [userId, amount_cents, currency, name || null, email || null, message || null, anonymous, donationToken]
        );
        
        const donation = result.rows[0];
        
        // If authenticated, count toward purchase bonus
        if (userId) {
            const purchaseCount = await db.query(
                `SELECT COUNT(*) + 1 as next_purchase FROM purchases WHERE buyer_id = $1 OR status = 'donation'`,
                [userId]
            );
            await db.query(
                `INSERT INTO purchases (buyer_id, listing_id, amount_cents, platform_fee_cents, seller_payout_cents, status, donation_id)
                 VALUES ($1, NULL, $2, 0, 0, 'donation', $3)`,
                [userId, amount_cents, donation.id]
            );
        }
        
        res.status(201).json({
            success: true,
            donation: { id: donation.id, amount_cents, currency },
            guest_token: donationToken,
            message: 'Thank you for your donation! Your generosity helps sustain this platform.'
        });
    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/landing/donations — Get donation history (for authenticated users or guest token)
router.get('/donations', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, amount_cents, currency, message, anonymous, status, created_at
             FROM donations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.userId]
        );
        res.json({ donations: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === USB PRAYER PURCHASES ===

// GET /api/landing/usb-prayer — Get USB prayer product info
router.get('/usb-prayer', async (req, res) => {
    res.json({
        product: {
            id: 'usb-prayer-premium',
            name: 'Premium USB Prayer Drive',
            description: 'A carefully curated collection of prayers, meditations, and sacred texts on a premium USB drive.',
            price_cents: 7999,
            currency: 'USD',
            features: [
                'Curated prayer collection',
                'Premium metal USB drive',
                'Compatible with all devices',
                'Includes digital download code',
                'Free worldwide shipping'
            ],
            in_stock: true
        }
    });
});

// POST /api/landing/usb-prayer/purchase — Purchase USB prayer drive (guest or authenticated)
router.post('/usb-prayer/purchase', async (req, res) => {
    try {
        const { 
            name, email, shipping_address, shipping_city, shipping_state, 
            shipping_zip, shipping_country = 'US', quantity = 1 
        } = req.body;
        
        if (!email || !shipping_address || !shipping_city || !shipping_zip) {
            return res.status(400).json({ error: 'Shipping information is required' });
        }
        
        const priceCents = 7999;
        const totalCents = priceCents * quantity;
        const userId = req.userId || null;
        const guestToken = userId ? null : crypto.randomBytes(16).toString('hex');
        
        const result = await db.query(
            `INSERT INTO usb_purchases (user_id, amount_cents, quantity, shipping_address, shipping_city, 
             shipping_state, shipping_zip, shipping_country, buyer_name, buyer_email, guest_token, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending_payment')
             RETURNING id, guest_token`,
            [userId, totalCents, quantity, shipping_address, shipping_city,
             shipping_state, shipping_zip, shipping_country, name, email, guestToken]
        );
        
        const purchase = result.rows[0];
        
        // If authenticated, count toward purchase bonus
        if (userId) {
            const purchaseCount = await db.query(
                `SELECT COUNT(*) + 1 as next_purchase FROM purchases WHERE buyer_id = $1`,
                [userId]
            );
            await db.query(
                `INSERT INTO purchases (buyer_id, listing_id, amount_cents, platform_fee_cents, seller_payout_cents, status, donation_id)
                 VALUES ($1, NULL, $2, 0, 0, 'usb_purchase', $3)`,
                [userId, totalCents, purchase.id]
            );
        }
        
        res.status(201).json({
            success: true,
            purchase: { id: purchase.id, total_cents: totalCents, quantity },
            guest_token: guestToken,
            message: 'Thank you for your purchase! A confirmation will be sent to your email.'
        });
    } catch (error) {
        console.error('USB purchase error:', error);
        res.status(500).json({ error: error.message });
    }
});

// === PAPER CURRENCY PURCHASES ===
const { getDenominationBreakdown, ALL_DENOMINATIONS } = require('../services/denominations');

// GET /api/landing/paper-currency — List available paper currencies
router.get('/paper-currency', async (req, res) => {
    try {
        const { currency } = req.query;
        if (currency) {
            const denom = ALL_DENOMINATIONS[currency.toUpperCase()];
            if (!denom) return res.status(404).json({ error: 'Currency not supported' });
            return res.json({ currency: currency.toUpperCase(), ...denom });
        }
        // Return all available currencies with paper designs
        const available = {};
        for (const [code, denom] of Object.entries(ALL_DENOMINATIONS)) {
            available[code] = {
                name: denom.name,
                symbol: denom.symbol,
                type: denom.type,
                billCount: denom.paper?.length || 0,
                coinCount: denom.coin?.length || 0,
                paper: denom.paper,
                coin: denom.coin,
            };
        }
        res.json({ currencies: available });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/landing/paper-currency/order — Order physical paper currency
router.post('/paper-currency/order', async (req, res) => {
    try {
        const {
            currency, denominations, name, email,
            shipping_address, shipping_city, shipping_state,
            shipping_zip, shipping_country = 'US'
        } = req.body;

        if (!currency || !denominations || !Array.isArray(denominations) || denominations.length === 0) {
            return res.status(400).json({ error: 'Currency and denominations are required' });
        }

        if (!email || !shipping_address || !shipping_city || !shipping_zip) {
            return res.status(400).json({ error: 'Shipping information is required' });
        }

        // Validate currency
        const denom = ALL_DENOMINATIONS[currency.toUpperCase()];
        if (!denom) return res.status(404).json({ error: 'Currency not supported' });

        // Calculate total from denominations
        let totalCents = 0;
        for (const item of denominations) {
            const value = parseFloat(item.value);
            const count = parseInt(item.count) || 1;
            totalCents += Math.round(value * count * 100);
        }

        if (totalCents <= 0) {
            return res.status(400).json({ error: 'Invalid order total' });
        }

        const userId = req.userId || null;
        const guestToken = userId ? null : crypto.randomBytes(16).toString('hex');

        const result = await db.query(
            `INSERT INTO paper_currency_orders (user_id, currency, denominations, total_cents,
             shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
             buyer_name, buyer_email, guest_token, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending_payment')
             RETURNING id, guest_token`,
            [userId, currency.toUpperCase(), JSON.stringify(denominations), totalCents,
             shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
             name, email, guestToken]
        );

        const purchase = result.rows[0];

        // Auto-mint from treasury if needed, then distribute to ordering user
        const MockMinting = require('../services/mockMinting');
        let treasuryBalance = await MockMinting.getTreasuryBalance();
        if (treasuryBalance < totalCents) {
            const shortfall = totalCents - treasuryBalance;
            await MockMinting.mintToTreasury(shortfall, 'Auto-mint for paper currency order', null);
        }
        
        // Count toward purchase bonus for authenticated users
        if (userId) {
            // Distribute from treasury to user (Credon equivalent of paper purchase)
            await MockMinting.distributeFromTreasury(userId, totalCents, 
                'Paper Currency Purchase Bonus', purchase.id);
            
            await db.query(
                `INSERT INTO purchases (buyer_id, listing_id, amount_cents, platform_fee_cents, seller_payout_cents, status, description)
                 VALUES ($1, NULL, $2, 0, 0, 'paper_currency', 'Paper Currency Purchase')`,
                [userId, totalCents]
            );
        }

        res.status(201).json({
            success: true,
            order: {
                id: purchase.id,
                currency: currency.toUpperCase(),
                currency_name: denom.name,
                denominations,
                total_cents: totalCents,
                total_display: `${denom.symbol}${(totalCents / Math.pow(10, denom.decimals)).toFixed(denom.decimals)}`,
            },
            guest_token: guestToken,
            message: 'Paper currency order received! A confirmation will be sent to your email.'
        });
    } catch (error) {
        console.error('Paper currency order error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
