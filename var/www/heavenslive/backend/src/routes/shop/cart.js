/**
 * Cart Routes — Supports both authenticated users and guest checkout.
 * 
 * Guest carts use a guest_token (sent as header X-Guest-Token or body field).
 * On login, guest cart items are automatically merged into the user's cart.
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const crypto = require('crypto');

// Optional auth — attaches userId if token present, guestToken otherwise
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { jwtSecret } = require('../../config/auth');
      const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
      req.userId = decoded.id;
      req.isGuest = false;
      return next();
    } catch (err) {
      // Token invalid, fall through to guest
    }
  }
  // Guest flow
  req.isGuest = true;
  req.guestToken = req.headers['x-guest-token'] || req.body?.guest_token;
  if (!req.guestToken) {
    req.guestToken = crypto.randomBytes(16).toString('hex');
  }
  next();
}

// GET cart (auth or guest)
router.get('/', optionalAuth, async (req, res) => {
    try {
        let result;
        if (req.isGuest) {
            result = await db.query(`
                SELECT c.*, l.title, l.price_cents, l.images,
                       l.allow_local_pickup, l.pickup_address, l.pickup_city,
                       l.pickup_state, l.pickup_zip, l.pickup_instructions
                FROM carts c
                JOIN listings l ON c.listing_id = l.id
                WHERE c.guest_token = $1
            `, [req.guestToken]);
        } else {
            result = await db.query(`
                SELECT c.*, l.title, l.price_cents, l.images,
                       l.allow_local_pickup, l.pickup_address, l.pickup_city,
                       l.pickup_state, l.pickup_zip, l.pickup_instructions
                FROM carts c
                JOIN listings l ON c.listing_id = l.id
                WHERE c.user_id = $1
            `, [req.userId]);
        }
        res.json({ cart: result.rows, guest_token: req.guestToken });
    } catch (error) {
        console.error('Cart error:', error);
        res.json({ cart: [], guest_token: req.guestToken });
    }
});

// ADD to cart (auth or guest)
router.post('/add', optionalAuth, async (req, res) => {
    try {
        const { listingId, quantity } = req.body;
        const listing = await db.query('SELECT id, price_cents, status FROM listings WHERE id = $1', [listingId]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        if (listing.rows[0].status !== 'active') return res.status(400).json({ error: 'Listing not available' });
        if (listing.rows[0].price_cents === 0) {
            return res.json({ free: true, message: 'This item is free — claim it directly!' });
        }
        
        if (req.isGuest) {
            await db.query(`
                INSERT INTO carts (user_id, listing_id, quantity, guest_token)
                VALUES (NULL, $1, $2, $3)
                ON CONFLICT (user_id, listing_id) DO UPDATE SET quantity = carts.quantity + $2
            `, [listingId, quantity || 1, req.guestToken]);
        } else {
            await db.query(`
                INSERT INTO carts (user_id, listing_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, listing_id) DO UPDATE SET quantity = carts.quantity + $3
            `, [req.userId, listingId, quantity || 1]);
        }
        
        res.json({ success: true, guest_token: req.guestToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REMOVE from cart (auth or guest)
router.delete('/:id', optionalAuth, async (req, res) => {
    try {
        if (req.isGuest) {
            await db.query('DELETE FROM carts WHERE id = $1 AND guest_token = $2', [req.params.id, req.guestToken]);
        } else {
            await db.query('DELETE FROM carts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        }
        res.json({ success: true, guest_token: req.guestToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MERGE guest cart into user cart (called after login)
router.post('/merge', verifyToken, async (req, res) => {
    try {
        const { guestToken } = req.body;
        if (!guestToken) return res.status(400).json({ error: 'guestToken required' });
        
        // Get guest cart items
        const guestItems = await db.query(
            'SELECT listing_id, quantity FROM carts WHERE guest_token = $1 AND user_id IS NULL',
            [guestToken]
        );
        
        // Merge into user cart
        for (const item of guestItems.rows) {
            await db.query(`
                INSERT INTO carts (user_id, listing_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, listing_id) DO UPDATE SET quantity = carts.quantity + $3
            `, [req.userId, item.listing_id, item.quantity]);
        }
        
        // Remove guest cart items
        await db.query('DELETE FROM carts WHERE guest_token = $1', [guestToken]);
        
        res.json({ success: true, merged: guestItems.rows.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
