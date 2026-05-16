const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Generate a random promo code
function generatePromoCode(prefix = '') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix ? prefix.toUpperCase() + '-' : '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Get seller's promotions
router.get('/my-promotions', verifyToken, async (req, res) => {
    try {
        const sellerId = req.userId;
        const result = await db.query(`
            SELECT p.*, 
                   l.title as listing_title,
                   s.store_name
            FROM promotions p
            LEFT JOIN listings l ON p.listing_id = l.id
            LEFT JOIN stores s ON p.store_id = s.id
            WHERE p.seller_id = $1
            ORDER BY p.created_at DESC
        `, [sellerId]);
        res.json({ promotions: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a promotion
router.post('/', verifyToken, async (req, res) => {
    try {
        const sellerId = req.userId;
        const { 
            listingId, storeId, promotionType, description,
            valuePercent, appliesTo, category, minPurchaseCents,
            maxDiscountCents, usageLimit, expiresAt, customCode
        } = req.body;
        
        // Validate promotion type matches listing type
        if (listingId) {
            const listing = await db.query(
                'SELECT type FROM listings WHERE id = $1 AND seller_id = $2',
                [listingId, sellerId]
            );
            if (listing.rows.length === 0) {
                return res.status(404).json({ error: 'Listing not found' });
            }
            const expectedType = listing.rows[0].type === 'reverse_auction' ? 'premium' : 'discount';
            if (promotionType !== expectedType) {
                return res.status(400).json({ 
                    error: `This listing requires ${expectedType} promotion type` 
                });
            }
        }
        
        // Generate or use custom code
        const code = customCode || generatePromoCode(promotionType === 'premium' ? 'PREMIUM' : 'SAVE');
        
        const result = await db.query(`
            INSERT INTO promotions 
            (seller_id, listing_id, store_id, promotion_type, code, description,
             value_percent, applies_to, category, min_purchase_cents, max_discount_cents,
             usage_limit, expires_at, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
            RETURNING *
        `, [sellerId, listingId, storeId, promotionType, code, description,
            valuePercent, appliesTo, category, minPurchaseCents, maxDiscountCents,
            usageLimit, expiresAt]);
        
        res.status(201).json({ success: true, promotion: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Promo code already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Validate a promo code (public)
router.post('/validate', async (req, res) => {
    try {
        const { code, listingId, cartTotal } = req.body;
        
        const result = await db.query(`
            SELECT * FROM promotions 
            WHERE code = $1 AND is_active = true 
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (usage_limit IS NULL OR used_count < usage_limit)
        `, [code]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ valid: false, error: 'Invalid or expired promo code' });
        }
        
        const promo = result.rows[0];
        
        // Check if applies to this listing/store
        if (promo.listing_id && promo.listing_id !== listingId) {
            return res.status(400).json({ valid: false, error: 'Code not valid for this item' });
        }
        
        // Check minimum purchase
        if (promo.min_purchase_cents && cartTotal < promo.min_purchase_cents) {
            return res.status(400).json({ 
                valid: false, 
                error: `Minimum purchase of $${(promo.min_purchase_cents / 100).toFixed(2)} required` 
            });
        }
        
        // Calculate discount
        let discountCents = Math.round(cartTotal * promo.value_percent / 100);
        if (promo.max_discount_cents && discountCents > promo.max_discount_cents) {
            discountCents = promo.max_discount_cents;
        }
        
        res.json({
            valid: true,
            promotion: {
                id: promo.id,
                code: promo.code,
                type: promo.promotion_type,
                valuePercent: promo.value_percent,
                discountCents,
                description: promo.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Apply promotion to purchase
router.post('/apply', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { promotionId, purchaseId, discountCents } = req.body;
        
        await db.query('BEGIN');
        
        // Record usage
        await db.query(`
            INSERT INTO promotion_usage (promotion_id, user_id, purchase_id, discount_cents)
            VALUES ($1, $2, $3, $4)
        `, [promotionId, userId, purchaseId, discountCents]);
        
        // Increment used count
        await db.query('UPDATE promotions SET used_count = used_count + 1 WHERE id = $1', [promotionId]);
        
        // Update purchase with discount
        await db.query('UPDATE purchases SET amount_cents = amount_cents - $1 WHERE id = $2', 
            [discountCents, purchaseId]);
        
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// Deactivate promotion
router.put('/:id/deactivate', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.userId;
        
        await db.query(
            'UPDATE promotions SET is_active = false WHERE id = $1 AND seller_id = $2',
            [id, sellerId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete promotion
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.userId;
        
        await db.query('DELETE FROM promotions WHERE id = $1 AND seller_id = $2', [id, sellerId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Updated validate endpoint - applies to final price after any offer
router.post('/validate', async (req, res) => {
    try {
        const { code, listingId, cartTotal, offerAccepted } = req.body;
        
        const result = await db.query(`
            SELECT * FROM promotions 
            WHERE code = $1 AND is_active = true 
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (usage_limit IS NULL OR used_count < usage_limit)
        `, [code]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ valid: false, error: 'Invalid or expired promo code' });
        }
        
        const promo = result.rows[0];
        
        // Check if applies to this listing/store
        if (promo.listing_id && promo.listing_id !== listingId) {
            return res.status(400).json({ valid: false, error: 'Code not valid for this item' });
        }
        
        // Use the final price (after any accepted offer)
        const finalPrice = cartTotal;
        
        // Check minimum purchase
        if (promo.min_purchase_cents && finalPrice < promo.min_purchase_cents) {
            return res.status(400).json({ 
                valid: false, 
                error: `Minimum purchase of $${(promo.min_purchase_cents / 100).toFixed(2)} required` 
            });
        }
        
        // Calculate discount on the FINAL price (after offer)
        let discountCents = Math.round(finalPrice * promo.value_percent / 100);
        if (promo.max_discount_cents && discountCents > promo.max_discount_cents) {
            discountCents = promo.max_discount_cents;
        }
        
        res.json({
            valid: true,
            promotion: {
                id: promo.id,
                code: promo.code,
                type: promo.promotion_type,
                valuePercent: promo.value_percent,
                discountCents,
                description: promo.description,
                note: offerAccepted ? 'Applied after accepted offer' : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
