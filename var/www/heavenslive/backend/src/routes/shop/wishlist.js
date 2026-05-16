const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Get user's wishlist
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, l.title, l.price_cents, l.images, l.status
            FROM wishlists w
            JOIN listings l ON w.listing_id = l.id
            WHERE w.user_id = $1 AND l.status = 'active'
            ORDER BY w.created_at DESC
        `, [req.userId]);
        res.json({ wishlist: result.rows });
    } catch (error) {
        console.error('Wishlist get error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Toggle wishlist item (add if not exists, remove if exists)
router.post('/toggle', verifyToken, async (req, res) => {
    try {
        const { listingId } = req.body;
        const userId = req.userId;
        
        // Check if listing exists and is active
        const listing = await db.query(
            'SELECT id, status FROM listings WHERE id = $1',
            [listingId]
        );
        if (listing.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        
        // Check if already in wishlist
        const existing = await db.query(
            'SELECT id FROM wishlists WHERE user_id = $1 AND listing_id = $2',
            [userId, listingId]
        );
        
        if (existing.rows.length > 0) {
            // Remove from wishlist
            await db.query('DELETE FROM wishlists WHERE id = $1', [existing.rows[0].id]);
            res.json({ added: false, message: 'Removed from wishlist' });
        } else {
            // Add to wishlist
            await db.query(
                'INSERT INTO wishlists (user_id, listing_id) VALUES ($1, $2)',
                [userId, listingId]
            );
            res.json({ added: true, message: 'Added to wishlist' });
        }
    } catch (error) {
        console.error('Wishlist toggle error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove item from wishlist
router.delete('/:listingId', verifyToken, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM wishlists WHERE user_id = $1 AND listing_id = $2',
            [req.userId, req.params.listingId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
