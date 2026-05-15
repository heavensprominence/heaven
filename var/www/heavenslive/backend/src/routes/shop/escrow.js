const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const paypalEscrow = require('../../services/paypalEscrow');
const { sendBuyerSaleConfirmation, sendSellerSaleNotification } = require('../../services/emailService');

router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const order = await paypalEscrow.createOrder(amount, currency);
        res.json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/capture-order', verifyToken, async (req, res) => {
    try {
        const { orderId, cartItems, shippingAddress } = req.body;
        const buyerId = req.userId;
        
        const capture = await paypalEscrow.captureOrder(orderId);
        
        await db.query('BEGIN');
        
        const feeSetting = await db.query(
            "SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_percent'"
        );
        const feePercent = feeSetting.rows[0]?.setting_value?.value || 0;
        
        const buyer = await db.query('SELECT email, full_name FROM users WHERE id = $1', [buyerId]);
        const buyerEmail = buyer.rows[0]?.email;
        const buyerName = buyer.rows[0]?.full_name || buyerEmail;
        
        for (const item of cartItems) {
            const listing = await db.query(
                'SELECT l.*, u.email as seller_email, u.full_name as seller_name FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = $1 FOR UPDATE',
                [item.listing_id]
            );
            
            if (listing.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Listing not found' });
            }
            
            const l = listing.rows[0];
            
            // BLOCK SELF-PURCHASE
            if (l.seller_id === buyerId) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: 'You cannot purchase your own listing' });
            }
            
            const itemTotal = l.price_cents * (item.quantity || 1);
            const feeCents = Math.round(itemTotal * feePercent / 100);
            const sellerPayout = itemTotal - feeCents;
            
            const escrowResult = await db.query(`
                INSERT INTO escrow_transactions 
                (buyer_id, seller_id, listing_id, amount_cents, platform_fee_cents, 
                 seller_payout_cents, paypal_order_id, paypal_capture_id, status, 
                 auto_release_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'held', NOW() + INTERVAL '45 days')
                RETURNING id
            `, [buyerId, l.seller_id, item.listing_id, itemTotal, feeCents, 
                sellerPayout, orderId, capture.captureId]);
            
            await db.query(`
                INSERT INTO purchases (buyer_id, listing_id, seller_id, amount_cents, 
                    platform_fee_cents, seller_payout_cents, paypal_order_id, paypal_capture_id,
                    shipping_address, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'paid')
            `, [buyerId, item.listing_id, l.seller_id, itemTotal, feeCents, sellerPayout,
                orderId, capture.captureId, JSON.stringify(shippingAddress)]);
            
            if (buyerEmail) {
                await sendBuyerSaleConfirmation(buyerEmail, l, itemTotal, l.seller_name || 'Seller');
            }
            if (l.seller_email) {
                await sendSellerSaleNotification(l.seller_email, l, itemTotal, feeCents, sellerPayout, buyerName);
            }
            
            if (l.quantity_available <= (item.quantity || 1)) {
                await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['sold', item.listing_id]);
            } else {
                await db.query(
                    'UPDATE listings SET quantity_available = quantity_available - $1, quantity_sold = COALESCE(quantity_sold, 0) + $1 WHERE id = $2',
                    [item.quantity || 1, item.listing_id]
                );
            }
        }
        
        await db.query('COMMIT');
        res.json({ success: true, message: 'Payment captured and held in escrow' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Capture error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
