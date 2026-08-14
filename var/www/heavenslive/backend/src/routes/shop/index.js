const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const { getUserPlan } = require('../../services/subscriptionService');
const fs = require('fs');
const path = require('path');
const { sendPickupInstructions, sendBuyerSaleConfirmation, sendSellerSaleNotification } = require('../../services/emailService');
const { autoTranslateListing } = require('../../services/translationService');
const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

async function geocodeLocation(city, state, country) {
    try {
        const res = await geocoder.geocode(`${city}, ${state}, ${country}`);
        if (res && res.length > 0) {
            return { lat: res[0].latitude, lng: res[0].longitude };
        }
    } catch (err) {
        console.error('Geocoding error:', err.message);
    }
    return { lat: null, lng: null };
}

const deleteImageFiles = (images) => {
    if (!images || !Array.isArray(images)) return;
    images.forEach(imageUrl => {
        if (!imageUrl) return;
        const filename = imageUrl.split('/').pop();
        const filepath = path.join(__dirname, '../../../public/uploads/listings', filename);
        try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (err) {}
    });
};

router.get('/buyer/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM purchases WHERE buyer_id = $1) as total_purchases,
                (SELECT COUNT(*) FROM offers WHERE buyer_id = $1 AND status = 'pending') as pending_offers,
                (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false) as unread_messages,
                (SELECT COUNT(*) FROM wishlists WHERE user_id = $1) as wishlist_count
        `, [userId]);
        res.json({ stats: stats.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/seller/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND status NOT IN ('deleted', 'expired')) as total_listings,
                (SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND status = 'active') as active_listings,
                (SELECT COUNT(*) FROM purchases WHERE seller_id = $1) as total_sales,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM purchases WHERE seller_id = $1) as revenue_cents,
                (SELECT COUNT(*) FROM offers o JOIN listings l ON o.listing_id = l.id WHERE l.seller_id = $1 AND o.status = 'pending') as pending_offers
        `, [userId]);
        res.json({ stats: stats.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/seller/listings', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = (page - 1) * limit;
        const status = req.query.status;
        
        let query = `SELECT l.*, (SELECT COUNT(*) FROM offers WHERE listing_id = l.id AND status = 'pending') as offer_count
            FROM listings l WHERE l.seller_id = $1`;
        const params = [userId];
        let paramCount = 1;
        
        if (status) {
            paramCount++;
            query += ` AND l.status = $${paramCount}`;
            params.push(status);
        } else {
            query += ` AND l.status NOT IN ('deleted', 'expired')`;
        }
        
        // Get total count
        const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) sub`, params);
        const total = parseInt(countResult.rows[0].count);
        
        query += ` ORDER BY l.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        res.json({ 
            listings: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/listings', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { 
            type, title, description, category, price_cents, min_bid_cents, max_bid_cents,
            images, location_city, location_state, location_country,
            shipping_options, weight_oz, dimensions, duration, quantity_available, store_id, currency, accepted_currencies,
            allow_local_pickup, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_country, pickup_instructions,
            is_featured = false, accepted_payment_methods
        } = req.body;
        
        // Validate featured listing request
        if (is_featured) {
            const plan = await getUserPlan(userId);
            const maxFeatured = plan?.limits?.featuredListings || 0;
            const currentFeatured = plan?.usage?.currentFeatured || 0;
            
            if (maxFeatured === 0) {
                return res.status(403).json({ 
                    error: 'Featured listings require a paid plan. Please upgrade to unlock this feature.' 
                });
            }
            
            if (currentFeatured >= maxFeatured && maxFeatured !== -1) {
                return res.status(403).json({ 
                    error: `You have used all ${maxFeatured} featured listing slots. Upgrade for more!` 
                });
            }
        }
        
        const coords = await geocodeLocation(location_city, location_state, location_country);
        
        // Process images — save base64 to disk, store URLs
        let imageUrls = [];
        if (images && Array.isArray(images)) {
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../../public/uploads/listings');
            fs.mkdirSync(uploadDir, { recursive: true });
            for (const img of images.slice(0, 3)) {  // Max 3 images
                if (typeof img === 'string' && img.startsWith('data:image/')) {
                    const ext = img.match(/^data:image\/(\w+)/)?.[1] || 'jpg';
                    const filename = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
                    const base64 = img.replace(/^data:image\/\w+;base64,/, '');
                    // Limit to ~3MB decoded
                    if (Buffer.from(base64, 'base64').length > 3 * 1024 * 1024) continue;
                    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(base64, 'base64'));
                    imageUrls.push(`/uploads/listings/${filename}`);
                } else if (typeof img === 'string' && img.length > 0) {
                    imageUrls.push(img);  // Already a URL
                }
            }
        }
        
        let expires_at = null;
        if (duration === '1day') expires_at = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
        else if (duration === '2weeks') expires_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        else if (duration === '1year') expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        
        const result = await db.query(`
            INSERT INTO listings (
                seller_id, store_id, type, title, description, category, price_cents, 
                min_bid_cents, max_bid_cents, images, location_city, location_state, 
                location_country, latitude, longitude, shipping_options, weight_oz, dimensions, 
                status, expires_at, auction_end_time, quantity_available,
                allow_local_pickup, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_country, pickup_instructions,
                is_featured, currency, accepted_currencies, accepted_payment_methods, is_dutch_auction
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'pending_approval', $19, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
            RETURNING *
        `, [
            userId, store_id || null, type, title, description, category, price_cents || 0,
            min_bid_cents, max_bid_cents, imageUrls, location_city, location_state,
            location_country, coords.lat, coords.lng, JSON.stringify(shipping_options || []), weight_oz, JSON.stringify(dimensions || {}),
            expires_at, quantity_available || 1,
            allow_local_pickup || false, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_country, pickup_instructions,
            is_featured, currency || 'USD', accepted_currencies ? JSON.stringify(accepted_currencies) : null, accepted_payment_methods ? JSON.stringify(accepted_payment_methods) : JSON.stringify(["paypal", "credon_wallet"]), (type === 'auction' && (quantity_available || 1) > 1)
        ]);
        
        res.status(201).json({ success: true, listing: result.rows[0] });
        autoTranslateListing(result.rows[0].id).catch(err => console.error("Auto-translate error:", err.message));
        
        if (type === "reverse_auction") {
            const { findMatchesForProcurement } = require("../../services/matchingEngine");
            findMatchesForProcurement(result.rows[0].id).catch(console.error);
        } else {
            const { findProcurementsForListing } = require("../../services/matchingEngine");
            findProcurementsForListing(result.rows[0].id).catch(console.error);
        }
        const { checkSavedSearches } = require("../../services/matchingEngine");
        checkSavedSearches(result.rows[0].id).catch(console.error);
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/listings/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const listing = await db.query('SELECT seller_id, images FROM listings WHERE id = $1', [id]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        if (listing.rows[0].seller_id !== userId) return res.status(403).json({ error: 'Not authorized' });
        deleteImageFiles(listing.rows[0].images);
        await db.query('DELETE FROM listings WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Platform fee: percentage of transaction retained by HeavensLive
async function getPlatformFeePercent() {
    try {
        // Check platform_settings first, then system_settings
        let r = await db.query("SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_structure'");
        if (r.rows.length === 0) {
            r = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_structure'");
        }
        if (r.rows.length > 0 && r.rows[0].setting_value) {
            const s = typeof r.rows[0].setting_value === 'string' 
                ? JSON.parse(r.rows[0].setting_value) 
                : r.rows[0].setting_value;
            return {
                clone: (s.clone_fee_percent || 7) / 100,
                fiat: (s.fiat_fee_percent || 9) / 100
            };
        }
    } catch (e) { console.log('Platform fee lookup failed:', e.message); }
    return { clone: 0.07, fiat: 0.09 };
}

// Calculate platform fee and seller payout
// Clone currencies use clone rate, fiat/crypto use fiat rate
function calcPayout(amountCents, platformFeePct, currency) {
    const isClone = currency && currency.startsWith('Credon-');
    const rate = isClone ? platformFeePct.clone : platformFeePct.fiat;
    const fee = Math.round(amountCents * rate);
    return { platformFeeCents: Math.max(fee, 1), sellerPayoutCents: amountCents - fee };
}

router.post('/listings/free-acquire', verifyToken, async (req, res) => {
    try {
        const { listingId } = req.body;
        const buyerId = req.userId;
        await db.query('BEGIN');
        const listing = await db.query('SELECT l.*, u.email as seller_email, u.full_name as seller_name FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = $1 AND l.status = $2 FOR UPDATE', [listingId, 'active']);
        if (listing.rows.length === 0) { await db.query('ROLLBACK'); return res.status(404).json({ error: 'Listing not found' }); }
        const l = listing.rows[0];
        if (l.price_cents !== 0) { await db.query('ROLLBACK'); return res.status(400).json({ error: 'Not free' }); }
        if (l.seller_id === buyerId) { await db.query('ROLLBACK'); return res.status(400).json({ error: 'Cannot acquire own listing' }); }
        
        await db.query('INSERT INTO purchases (buyer_id, listing_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents, status, currency_code) VALUES ($1, $2, $3, 0, 0, 0, $4, $5)', [buyerId, listingId, l.seller_id, 'completed', l.currency || 'USD']);
        await db.query('INSERT INTO sales_history (listing_id, listing_title, listing_type, buyer_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents) VALUES ($1, $2, $3, $4, $5, 0, 0, 0)', [listingId, l.title, l.type, buyerId, l.seller_id]);
        
        const buyer = await db.query('SELECT email, full_name FROM users WHERE id = $1', [buyerId]);
        const buyerEmail = buyer.rows[0]?.email;
        const buyerName = buyer.rows[0]?.full_name || buyerEmail;
        
        if (buyerEmail) {
            await sendBuyerSaleConfirmation(buyerEmail, l, 0, l.seller_name || 'Seller');
        }
        if (l.seller_email) {
            await sendSellerSaleNotification(l.seller_email, l, 0, 0, 0, buyerName);
        }
        
        if (l.allow_local_pickup) {
            await sendPickupInstructions(buyerEmail, l, {
                name: l.seller_name,
                phone: null,
                email: l.seller_email
            });
        }
        
        if (l.quantity_available <= 1) {
            await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['sold', listingId]);
            deleteImageFiles(l.images);
        } else {
            await db.query('UPDATE listings SET quantity_available = quantity_available - 1, quantity_sold = COALESCE(quantity_sold, 0) + 1 WHERE id = $1', [listingId]);
        }
        await db.query('COMMIT');
        res.json({ success: true });
    } catch (error) { await db.query('ROLLBACK'); res.status(500).json({ error: error.message }); }
});

router.post('/checkout', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { cartItems, shippingAddress, deliveryMethod, paymentMethod, shippingCostCents } = req.body;
        const useWallet = paymentMethod === 'credon_wallet';
        
        if (useWallet) {
            // Verify Credon wallet balance in USD (shipping) + listing currency (items)
            const wallet = await db.query('SELECT balance_cents FROM wallets WHERE user_id = $1', [userId]);
            const balance = wallet.rows[0]?.balance_cents || 0;
            
            let totalNeededUSD = shippingCostCents || 0;
            for (const item of cartItems) {
                const l = await db.query('SELECT price_cents, currency FROM listings WHERE id = $1', [item.listing_id]);
                if (l.rows[0]) {
                    const cur = l.rows[0].currency || 'USD';
                    if (cur === 'USD' || cur === 'Credon-USD') {
                        totalNeededUSD += l.rows[0].price_cents || 0;
                    }
                    // For non-USD currencies, convert via exchange rates
                    // Simplified: just check USD equivalent
                }
            }
            totalNeededUSD = Math.max(totalNeededUSD, 1);
            
            if (balance < totalNeededUSD) {
                return res.status(402).json({ 
                    error: 'Insufficient Credon wallet balance', 
                    needed: totalNeededUSD, 
                    balance 
                });
            }
        }
        
        await db.query('BEGIN');
        const platformFeePct = await getPlatformFeePercent();
        
        for (const item of cartItems) {
            const listing = await db.query('SELECT l.*, u.email as seller_email, u.full_name as seller_name FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.id = $1 AND l.status = $2 FOR UPDATE', [item.listing_id, 'active']);
            if (listing.rows.length === 0) { await db.query('ROLLBACK'); return res.status(400).json({ error: 'Listing not available' }); }
            const l = listing.rows[0];
            
            if (l.seller_id === userId) { await db.query('ROLLBACK'); return res.status(400).json({ error: 'Cannot purchase own listing' }); }
            
            const amountCents = parseInt(l.price_cents) || 0;
            const { platformFeeCents, sellerPayoutCents } = calcPayout(amountCents, platformFeePct, l.currency);
            
            await db.query(
                'INSERT INTO purchases (buyer_id, listing_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents, shipping_address, delivery_method, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [userId, item.listing_id, l.seller_id, amountCents, platformFeeCents, sellerPayoutCents, shippingAddress ? JSON.stringify(shippingAddress) : null, deliveryMethod || 'shipping', useWallet ? 'paid' : 'pending_payment']
            );
            
            await db.query(
                'INSERT INTO sales_history (listing_id, listing_title, listing_type, buyer_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [item.listing_id, l.title, l.type, userId, l.seller_id, amountCents, platformFeeCents, sellerPayoutCents]
            );
            
            if (l.quantity_available <= (item.quantity || 1)) {
                await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['sold', item.listing_id]);
                deleteImageFiles(l.images);
            } else {
                await db.query('UPDATE listings SET quantity_available = quantity_available - $1, quantity_sold = COALESCE(quantity_sold, 0) + $1 WHERE id = $2', [item.quantity || 1, item.listing_id]);
            }
            
            if (deliveryMethod === 'pickup' && l.allow_local_pickup) {
                const buyer = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
                if (buyer.rows[0]) {
                    await sendPickupInstructions(buyer.rows[0].email, l, {
                        name: l.seller_name, phone: null, email: l.seller_email
                    });
                }
            }
        }
        
        // Deduct from Credon wallet if paying with wallet
        if (useWallet) {
            const totalCents = cartItems.reduce((sum, item) => sum + (parseInt(item.price_cents) || 0), 0) + (shippingCostCents || 0);
            await Wallet.updateBalance(userId, -totalCents, 'purchase', `Shop purchase: $${(totalCents/100).toFixed(2)}`, null, 'USD');
            await db.query(
                "INSERT INTO transactions (user_id, amount_cents, type, description) VALUES ($1, $2, 'debit', $3)",
                [userId, -totalCents, 'Marketplace purchase via Credon wallet']
            );
        }
        
        await db.query('DELETE FROM carts WHERE user_id = $1', [userId]);
        await db.query('COMMIT');
        
        // Process affiliate commissions (buyer + seller side)
        const { processReferralPurchase, awardSaleCommission } = require('../services/affiliateService');
        for (const item of cartItems) {
            try {
                const listing = await db.query('SELECT seller_id, price_cents FROM listings WHERE id = $1', [item.listing_id]);
                if (listing.rows[0]) {
                    const amountCents = parseInt(listing.rows[0].price_cents) || 0;
                    // Seller commission (if seller was referred)
                    await awardSaleCommission(listing.rows[0].seller_id, item.listing_id, amountCents);
                    // Buyer commission (if buyer was referred)
                    await processReferralPurchase(userId, item.listing_id, amountCents, 'buyer');
                }
            } catch (e) { console.log('Affiliate commission (non-critical):', e.message); }
        }
        
        res.json({ 
            success: true, 
            paymentMethod: paymentMethod || 'paypal',
            walletDeducted: useWallet,
            shippingCurrency: 'USD'
        });
    } catch (error) { await db.query('ROLLBACK'); res.status(500).json({ error: error.message }); }
});

router.get('/seller/orders', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db.query(`
            SELECT p.*, l.title, u.email as buyer_email, u.full_name as buyer_name
            FROM purchases p
            JOIN listings l ON p.listing_id = l.id
            JOIN users u ON p.buyer_id = u.id
            WHERE p.seller_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        res.json({ orders: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/listings/:id/bid', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { bid_cents, quantity = 1 } = req.body;
        
        await db.query('BEGIN');
        
        const listing = await db.query(
            'SELECT * FROM listings WHERE id = $1 AND status = $2 FOR UPDATE',
            [id, 'active']
        );
        
        if (listing.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Listing not found or not active' });
        }
        
        const l = listing.rows[0];
        const isReverseAuction = l.type === 'reverse_auction';
        const isDutch = l.is_dutch_auction === true || l.quantity_available > 1;
        
        if (l.auction_end_time && new Date(l.auction_end_time) < new Date()) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: isReverseAuction ? 'Procurement has closed' : 'Auction has ended' });
        }
        
        if (isReverseAuction) {
            const maxAllowed = l.current_bid_cents || l.max_bid_cents;
            if (bid_cents >= maxAllowed) {
                await db.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `Proposal must be less than $${(maxAllowed / 100).toFixed(2)}` 
                });
            }
        } else if (isDutch) {
            // Dutch / multi-unit: bid must be at/above the floor (min_bid_cents)
            const floor = l.min_bid_cents || 1;
            if (bid_cents < floor) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: `Bid must be at least $${(floor / 100).toFixed(2)}` });
            }
        } else {
            const minRequired = l.current_bid_cents 
                ? Math.ceil(l.current_bid_cents * 1.1)
                : l.min_bid_cents;
            
            if (bid_cents < minRequired) {
                await db.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `Bid must be at least $${(minRequired / 100).toFixed(2)}` 
                });
            }
        }
        
        await db.query(`
            INSERT INTO auction_bids (listing_id, bidder_id, amount_cents, quantity, is_winning)
            VALUES ($1, $2, $3, $4, false)
        `, [id, userId, bid_cents, quantity]);

        // Outbid notice to the previous high bidder (regular single-unit auctions)
        if (!isReverseAuction && !isDutch && l.current_bidder_id && l.current_bidder_id !== userId) {
            const prev = await db.query('SELECT email, full_name FROM users WHERE id = $1', [l.current_bidder_id]);
            if (prev.rows[0]) {
                const { sendOutbidNotification } = require('../../services/emailService');
                sendOutbidNotification(prev.rows[0].email, prev.rows[0].full_name, l, bid_cents).catch(() => {});
            }
        }
        
        await db.query(`
            UPDATE listings 
            SET current_bid_cents = $1, current_bidder_id = $2, bid_count = COALESCE(bid_count, 0) + 1
            WHERE id = $3
        `, [bid_cents, userId, id]);
        
        await db.query('COMMIT');
        
        const successMessage = isReverseAuction 
            ? 'Proposal submitted! The buyer will review all proposals.' 
            : (isDutch ? 'Bid placed! Winners determined at auction end.' : 'Bid placed successfully!');
        
        res.json({ success: true, message: successMessage, isReverseAuction });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Bid error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /listings/:id/buy-now — instant purchase at the buy-it-now price (auctions)
router.post('/listings/:id/buy-now', verifyToken, async (req, res) => {
    try {
        const listing = await db.query('SELECT * FROM listings WHERE id = $1 AND status = $2', [req.params.id, 'active']);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not available' });
        const l = listing.rows[0];
        if (l.type !== 'auction') return res.status(400).json({ error: 'Buy Now is only for auctions' });
        if (!l.buy_it_now_price_cents) return res.status(400).json({ error: 'Buy Now is not available for this listing' });
        if (l.seller_id === req.userId) return res.status(400).json({ error: 'Cannot buy your own listing' });

        const price = parseInt(l.buy_it_now_price_cents, 10);
        await db.query('BEGIN');
        const platformFeePct = await getPlatformFeePercent();
        const { platformFeeCents, sellerPayoutCents } = calcPayout(price, platformFeePct, l.currency);
        await db.query(
            `INSERT INTO purchases (buyer_id, listing_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending_payment')`,
            [req.userId, l.id, l.seller_id, price, platformFeeCents, sellerPayoutCents]
        );
        await db.query(`UPDATE listings SET status = 'sold', current_bidder_id = $2, current_bid_cents = $3 WHERE id = $1`, [l.id, req.userId, price]);
        await db.query('COMMIT');
        res.json({ success: true, price_cents: price, message: 'Item reserved! Complete payment to finalize.' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// POST /listings/:id/bid/retract — retract my bid
router.post('/listings/:id/bid/retract', verifyToken, async (req, res) => {
    try {
        const listing = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        const l = listing.rows[0];
        if (l.status !== 'active') return res.status(400).json({ error: 'Auction has ended' });
        if (l.auction_end_time && new Date(l.auction_end_time) < new Date()) return res.status(400).json({ error: 'Auction has ended' });

        const removed = await db.query('DELETE FROM auction_bids WHERE listing_id = $1 AND bidder_id = $2 RETURNING id', [req.params.id, req.userId]);
        // If I was the high bidder, restore the next highest bid
        if (l.current_bidder_id === req.userId) {
            const next = await db.query('SELECT * FROM auction_bids WHERE listing_id = $1 ORDER BY amount_cents DESC, created_at ASC LIMIT 1', [req.params.id]);
            await db.query(
                `UPDATE listings SET current_bid_cents = $2, current_bidder_id = $3, bid_count = GREATEST(COALESCE(bid_count, 0) - $4, 0) WHERE id = $1`,
                [req.params.id, next.rows[0]?.amount_cents || null, next.rows[0]?.bidder_id || null, removed.rows.length]
            );
        }
        res.json({ success: true, retracted: removed.rows.length });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /listings/:id/bids — seller view of bids (auctions + procurement proposals)
router.get('/listings/:id/bids', verifyToken, async (req, res) => {
    try {
        const listing = await db.query('SELECT seller_id, type FROM listings WHERE id = $1', [req.params.id]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        if (listing.rows[0].seller_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });

        const bids = await db.query(
            `SELECT b.*, u.full_name as bidder_name, u.email as bidder_email
             FROM auction_bids b JOIN users u ON b.bidder_id = u.id
             WHERE b.listing_id = $1 ORDER BY b.amount_cents DESC, b.created_at ASC`,
            [req.params.id]
        );
        res.json({ bids: bids.rows, listing_type: listing.rows[0].type });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /listings/:id/accept-bid — procurement: buyer accepts a seller's proposal
router.post('/listings/:id/accept-bid', verifyToken, async (req, res) => {
    try {
        const { bidId } = req.body;
        if (!bidId) return res.status(400).json({ error: 'bidId required' });

        const listing = await db.query('SELECT * FROM listings WHERE id = $1 AND seller_id = $2', [req.params.id, req.userId]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        const l = listing.rows[0];
        if (l.type !== 'reverse_auction') return res.status(400).json({ error: 'Only procurement (reverse auction) listings accept proposals' });

        const bid = await db.query('SELECT * FROM auction_bids WHERE id = $1 AND listing_id = $2', [bidId, req.params.id]);
        if (bid.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
        const b = bid.rows[0];

        await db.query(`UPDATE auction_bids SET is_winning = true, winning_quantity = 1, clearing_price_cents = amount_cents WHERE id = $1`, [bidId]);
        await db.query(`UPDATE listings SET status = 'sold', current_bidder_id = $2, current_bid_cents = $3 WHERE id = $1`, [req.params.id, b.bidder_id, b.amount_cents]);
        res.json({ success: true, accepted_bid_cents: b.amount_cents });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /listings/:id/offer — buyer makes an offer on a mall/classifieds listing
router.post('/listings/:id/offer', verifyToken, async (req, res) => {
    try {
        const { offer_cents, message } = req.body;
        if (!offer_cents || offer_cents <= 0) return res.status(400).json({ error: 'Offer amount required' });

        const listing = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        const l = listing.rows[0];
        if (l.status !== 'active') return res.status(400).json({ error: 'Listing not available' });
        if (l.seller_id === req.userId) return res.status(400).json({ error: 'Cannot offer on your own listing' });

        const result = await db.query(
            `INSERT INTO offers (listing_id, buyer_id, offer_cents, message, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
            [req.params.id, req.userId, offer_cents, message || null]
        );
        const _offerSeller = await db.query('SELECT email, full_name FROM users WHERE id = $1', [l.seller_id]);
        if (_offerSeller.rows[0]) {
            const { sendOfferReceived } = require('../../services/emailService');
            sendOfferReceived(_offerSeller.rows[0].email, _offerSeller.rows[0].full_name, l, offer_cents, message || '').catch(() => {});
        }
        res.json({ success: true, offer: result.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /offers/:id/accept — seller accepts an offer
router.post('/offers/:id/accept', verifyToken, async (req, res) => {
    try {
        const offer = await db.query(`SELECT o.*, l.seller_id, l.quantity_available, l.title FROM offers o JOIN listings l ON o.listing_id = l.id WHERE o.id = $1`, [req.params.id]);
        if (offer.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
        const o = offer.rows[0];
        if (o.seller_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
        if (o.status !== 'pending') return res.status(400).json({ error: 'Offer already resolved' });

        await db.query(`UPDATE offers SET status = 'accepted', updated_at = NOW() WHERE id = $1`, [req.params.id]);
        const _acceptBuyer = await db.query('SELECT email, full_name FROM users WHERE id = $1', [o.buyer_id]);
        if (_acceptBuyer.rows[0]) {
            const { sendOfferResponse } = require('../../services/emailService');
            sendOfferResponse(_acceptBuyer.rows[0].email, _acceptBuyer.rows[0].full_name, { id: o.listing_id, title: o.title }, 'accepted', null).catch(() => {});
        }
        if ((o.quantity_available || 1) <= 1) {
            await db.query(`UPDATE listings SET status = 'sold' WHERE id = $1`, [o.listing_id]);
        } else {
            await db.query(`UPDATE listings SET quantity_available = quantity_available - 1, quantity_sold = COALESCE(quantity_sold, 0) + 1 WHERE id = $1`, [o.listing_id]);
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /offers/:id/reject — seller rejects an offer
router.post('/offers/:id/reject', verifyToken, async (req, res) => {
    try {
        const offer = await db.query(`SELECT o.*, l.seller_id, l.title FROM offers o JOIN listings l ON o.listing_id = l.id WHERE o.id = $1`, [req.params.id]);
        if (offer.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
        if (offer.rows[0].seller_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
        await db.query(`UPDATE offers SET status = 'rejected', seller_response = $2, updated_at = NOW() WHERE id = $1`, [req.params.id, req.body.message || null]);
        const _rejBuyer = await db.query('SELECT email, full_name FROM users WHERE id = $1', [offer.rows[0].buyer_id]);
        if (_rejBuyer.rows[0]) {
            const { sendOfferResponse } = require('../../services/emailService');
            sendOfferResponse(_rejBuyer.rows[0].email, _rejBuyer.rows[0].full_name, { id: offer.rows[0].listing_id, title: offer.rows[0].title }, 'rejected', req.body.message || null).catch(() => {});
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /offers/:id/counter — seller counters (free-text response)
router.post('/offers/:id/counter', verifyToken, async (req, res) => {
    try {
        const offer = await db.query(`SELECT o.*, l.seller_id, l.title FROM offers o JOIN listings l ON o.listing_id = l.id WHERE o.id = $1`, [req.params.id]);
        if (offer.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
        if (offer.rows[0].seller_id !== req.userId) return res.status(403).json({ error: 'Not authorized' });
        await db.query(`UPDATE offers SET status = 'countered', seller_response = $2, updated_at = NOW() WHERE id = $1`, [req.params.id, req.body.message || null]);
        const _ctrBuyer = await db.query('SELECT email, full_name FROM users WHERE id = $1', [offer.rows[0].buyer_id]);
        if (_ctrBuyer.rows[0]) {
            const { sendOfferResponse } = require('../../services/emailService');
            sendOfferResponse(_ctrBuyer.rows[0].email, _ctrBuyer.rows[0].full_name, { id: offer.rows[0].listing_id, title: offer.rows[0].title }, 'countered', req.body.message || null).catch(() => {});
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/buyer/purchases', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db.query(`
            SELECT p.*, l.title, l.images[1] as image,
                   u.full_name as seller_name, u.email as seller_email
            FROM purchases p
            JOIN listings l ON p.listing_id = l.id
            JOIN users u ON p.seller_id = u.id
            WHERE p.buyer_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        res.json({ purchases: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/seller/sales', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db.query(`
            SELECT p.*, l.title, l.images[1] as image,
                   u.full_name as buyer_name, u.email as buyer_email
            FROM purchases p
            JOIN listings l ON p.listing_id = l.id
            JOIN users u ON p.buyer_id = u.id
            WHERE p.seller_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        res.json({ sales: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/seller/offers', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, l.title, u.full_name as buyer_name
            FROM offers o JOIN listings l ON o.listing_id = l.id JOIN users u ON o.buyer_id = u.id
            WHERE l.seller_id = $1 AND o.status = 'pending' ORDER BY o.created_at DESC
        `, [req.userId]);
        res.json({ offers: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/buyer/following', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.* FROM stores s
            JOIN followed_stores fs ON s.id = fs.store_id
            WHERE fs.user_id = $1
        `, [req.userId]);
        res.json({ stores: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/buyer/following/:storeId', verifyToken, async (req, res) => {
    try {
        await db.query('DELETE FROM followed_stores WHERE user_id = $1 AND store_id = $2', [req.userId, req.params.storeId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/listings/bulk-delete', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.userId;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No listings selected' });
        }
        
        const checkResult = await db.query(
            'SELECT id FROM listings WHERE id = ANY($1::uuid[]) AND seller_id != $2',
            [ids, userId]
        );
        
        if (checkResult.rows.length > 0) {
            return res.status(403).json({ error: 'You can only delete your own listings' });
        }
        
        const listings = await db.query(
            'SELECT images FROM listings WHERE id = ANY($1::uuid[])',
            [ids]
        );
        
        for (const listing of listings.rows) {
            deleteImageFiles(listing.images);
        }
        
        await db.query('DELETE FROM listings WHERE id = ANY($1::uuid[])', [ids]);
        
        res.json({ success: true, deleted: ids.length });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.use('/translations', require('./translations'));
// Record a completed purchase with platform fee calculation
router.post('/purchases/complete', verifyToken, async (req, res) => {
    try {
        const { listingId, amountCents, currency, paypalOrderId } = req.body;
        if (!listingId || !amountCents) return res.status(400).json({ error: 'listingId and amountCents required' });
        
        const listing = await db.query('SELECT l.*, u.referrer_id as seller_referrer FROM listings l LEFT JOIN users u ON l.seller_id = u.id WHERE l.id = $1', [listingId]);
        if (listing.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        
        const l = listing.rows[0];
        const platformFeePct = await getPlatformFeePercent();
        const { platformFeeCents, sellerPayoutCents } = calcPayout(amountCents, platformFeePct, l.currency);
        
        const result = await db.query(
            `INSERT INTO purchases (buyer_id, listing_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents, status, paypal_order_id)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7) RETURNING *`,
            [req.userId, listingId, l.seller_id, amountCents, platformFeeCents, sellerPayoutCents, paypalOrderId || null]
        );
        
        // Process affiliate commissions (buyer + seller side)
        const { processReferralPurchase, awardSaleCommission } = require('../services/affiliateService');
        try {
            await awardSaleCommission(l.seller_id, listingId, amountCents);
        } catch (e) { console.log('Sale commission (non-critical):', e.message); }
        try {
            await processReferralPurchase(req.userId, result.rows[0].id, amountCents, 'buyer');
        } catch (e) { console.log('Affiliate commission (non-critical):', e.message); }
        
        res.json({
            success: true,
            purchase: result.rows[0],
            platformFee: { percent: Math.round(platformFeePct * 100), cents: platformFeeCents },
            sellerPayout: sellerPayoutCents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bug report submission
router.post('/bug-report', async (req, res) => {
    try {
        const { page, description, email, screenshot } = req.body;
        const fs = require('fs');
        const path = require('path');
        
        // Save screenshot if provided
        let screenshotFile = '';
        if (screenshot && screenshot.startsWith('data:image/')) {
            const ext = screenshot.match(/^data:image\/(\w+)/)[1] || 'png';
            const ts = Date.now();
            const filename = `bug-${ts}.${ext}`;
            const dir = path.join(__dirname, '../../public/uploads/bug-screenshots');
            fs.mkdirSync(dir, { recursive: true });
            const base64 = screenshot.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));
            screenshotFile = filename;
        }
        
        // Store in database
        const userId = req.userId || null;
        const browser = req.headers['user-agent'] || '';
        await db.query(
            'INSERT INTO bug_reports (user_id, name, email, page, description, screenshot, browser) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, req.body.name || null, email || null, page || null, description, screenshotFile || null, browser]
        );
        
        const report = `[${new Date().toISOString()}] ${email||'anonymous'} | ${page||'unknown'} | screenshot: ${screenshotFile||'none'}
${description}
---
`;
        fs.appendFileSync(path.join(__dirname, '../../bug-reports.log'), report);
        res.json({ success: true, message: 'Bug report submitted. Thank you!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get bug reports
router.get('/bug-reports', verifyToken, async (req, res) => {
    try {
        if (!req.isSuperAdmin) return res.status(403).json({ error: 'Admin required' });
        const result = await db.query('SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 50');
        res.json({ reports: result.rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
