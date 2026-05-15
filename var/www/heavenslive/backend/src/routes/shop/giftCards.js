const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const crypto = require('crypto');

// Generate unique gift card code
function generateGiftCardCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) code += '-';
    }
    return code;
}

// Purchase a gift card
router.post('/purchase', verifyToken, async (req, res) => {
    try {
        const { amount, recipientName, recipientEmail, message } = req.body;
        const purchaserId = req.userId;
        const amountCents = Math.round(amount * 100);
        
        if (amountCents < 100 || amountCents > 100000) {
            return res.status(400).json({ error: 'Amount must be between $1 and $1000' });
        }
        
        const purchaser = await db.query('SELECT email FROM users WHERE id = $1', [purchaserId]);
        const code = generateGiftCardCode();
        
        const result = await db.query(`
            INSERT INTO gift_cards 
            (code, initial_amount_cents, current_balance_cents, purchaser_id, purchaser_email, recipient_name, recipient_email, message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [code, amountCents, amountCents, purchaserId, purchaser.rows[0].email, recipientName, recipientEmail, message]);
        
        // Record purchase transaction
        await db.query(`
            INSERT INTO gift_card_transactions (gift_card_id, amount_cents, transaction_type, balance_after_cents)
            VALUES ($1, $2, 'purchase', $3)
        `, [result.rows[0].id, amountCents, amountCents]);
        
        res.status(201).json({ success: true, giftCard: result.rows[0] });
    } catch (error) {
        console.error('Purchase gift card error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check gift card balance (public)
router.post('/check-balance', async (req, res) => {
    try {
        const { code } = req.body;
        const result = await db.query(`
            SELECT code, current_balance_cents, status, expires_at 
            FROM gift_cards 
            WHERE code = $1
        `, [code.toUpperCase()]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ valid: false, error: 'Invalid gift card code' });
        }
        
        const card = result.rows[0];
        if (card.status !== 'active') {
            return res.json({ valid: false, error: 'Gift card is not active' });
        }
        if (card.expires_at < new Date()) {
            return res.json({ valid: false, error: 'Gift card has expired' });
        }
        if (card.current_balance_cents <= 0) {
            return res.json({ valid: false, error: 'Gift card has zero balance' });
        }
        
        res.json({ 
            valid: true, 
            balance: card.current_balance_cents / 100,
            message: `Balance: $${(card.current_balance_cents / 100).toFixed(2)}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Redeem gift card at checkout
router.post('/redeem', verifyToken, async (req, res) => {
    try {
        const { code, amount } = req.body;
        const userId = req.userId;
        const redeemAmount = Math.round(amount * 100);
        
        await db.query('BEGIN');
        
        const result = await db.query(
            'SELECT * FROM gift_cards WHERE code = $1 FOR UPDATE',
            [code.toUpperCase()]
        );
        
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ valid: false, error: 'Invalid gift card code' });
        }
        
        const card = result.rows[0];
        if (card.status !== 'active') {
            await db.query('ROLLBACK');
            return res.json({ valid: false, error: 'Gift card is not active' });
        }
        if (card.expires_at < new Date()) {
            await db.query('ROLLBACK');
            return res.json({ valid: false, error: 'Gift card has expired' });
        }
        if (card.current_balance_cents < redeemAmount) {
            await db.query('ROLLBACK');
            return res.json({ 
                valid: false, 
                error: `Insufficient balance. Available: $${(card.current_balance_cents / 100).toFixed(2)}` 
            });
        }
        
        const newBalance = card.current_balance_cents - redeemAmount;
        
        await db.query(
            'UPDATE gift_cards SET current_balance_cents = $1, is_redeemed = true, redeemed_by = $2, redeemed_at = NOW() WHERE id = $3',
            [newBalance, userId, card.id]
        );
        
        await db.query(`
            INSERT INTO gift_card_transactions (gift_card_id, amount_cents, transaction_type, balance_after_cents)
            VALUES ($1, $2, 'redemption', $3)
        `, [card.id, redeemAmount, newBalance]);
        
        await db.query('COMMIT');
        
        res.json({ 
            valid: true, 
            applied: redeemAmount / 100,
            remaining: newBalance / 100,
            message: `$${(redeemAmount / 100).toFixed(2)} applied from gift card`
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Redeem gift card error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's purchased gift cards
router.get('/my-purchases', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM gift_cards WHERE purchaser_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json({ giftCards: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
