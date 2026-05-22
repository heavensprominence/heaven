const express = require('express');
const router = express.Router();
const db = require('../../db');

// Get listings with filters
router.get('/', async (req, res) => {
    try {
        const { q, type, category, minPrice, maxPrice, sort, page = 1, limit = 12, lat, lng, radius, lang } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const tl_title = (lang && lang !== 'en') ? `COALESCE(lt.title, l.title)` : `l.title`;
        const tl_desc = (lang && lang !== 'en') ? `COALESCE(lt.description, l.description)` : `l.description`;
        const tjoin = (lang && lang !== 'en') ? ` LEFT JOIN listing_translations lt ON lt.listing_id = l.id AND lt.language_code = '${lang.replace(/[^a-z-]/g,'')}'` : '';
        
        let query = `
            SELECT l.id, l.seller_id, l.store_id, l.type, ${tl_title} as title, ${tl_desc} as description, l.category, l.price_cents,
                   l.starting_price_cents, l.reserve_price_cents, l.buy_it_now_price_cents, l.current_bid_cents,
                   l.bid_increment_cents, l.reverse_target_specs, l.quantity_available, l.quantity_sold, l.images, l.video_url,
                   l.location_city, l.location_state, l.location_country, l.latitude, l.longitude,
                   l.is_local_pickup, l.shipping_options, l.inventory_tracking, l.status, l.approved_by, l.approved_at,
                   l.auction_end_time, l.created_at, l.updated_at, l.duration, l.expires_at,
                   l.min_bid_cents, l.max_bid_cents, l.bid_increment_percent, l.current_bidder_id, l.bid_count,
                   l.shipping_provider, l.shipping_tracking, l.weight_oz, l.dimensions,
                   l.deleted_at, l.deletion_reason, l.is_dutch_auction, l.dutch_clearing_price_cents,
                   l.allow_local_pickup, l.pickup_address, l.pickup_city, l.pickup_state, l.pickup_zip, l.pickup_instructions, l.pickup_country,
                   l.poster_role, l.item_condition, l.is_featured, l.source_language, l.currency, l.accepted_currencies,
                   u.email as seller_email, s.store_name,
                   (SELECT COUNT(*) FROM listings l2 WHERE l2.status = 'active') as total_count,
                   (SELECT json_build_object('code', p.code, 'value_percent', p.value_percent, 'promotion_type', p.promotion_type) 
                    FROM promotions p 
                    WHERE (p.listing_id = l.id OR p.store_id = l.store_id) 
                      AND p.is_active = true 
                      AND (p.expires_at IS NULL OR p.expires_at > NOW())
                      AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
                    LIMIT 1) as promotion
            FROM listings l
            ${tjoin}
            LEFT JOIN users u ON l.seller_id = u.id
            LEFT JOIN stores s ON l.store_id = s.id
            WHERE l.status = 'active'
        `;
        const params = [];
        let paramCount = 1;
        
        if (q) { query += ` AND (l.title ILIKE $${paramCount} OR l.description ILIKE $${paramCount} OR EXISTS (SELECT 1 FROM listing_translations lt WHERE lt.listing_id = l.id AND (lt.title ILIKE $${paramCount} OR lt.description ILIKE $${paramCount})))`; params.push(`%${q}%`); paramCount++; }
        if (type) { query += ` AND l.type = $${paramCount}`; params.push(type); paramCount++; }
        if (category) { query += ` AND l.category = $${paramCount}`; params.push(category); paramCount++; }
        if (req.query.condition) { query += ` AND l.item_condition = $${paramCount}`; params.push(req.query.condition); paramCount++; }
        if (minPrice) { query += ` AND COALESCE(l.price_cents, l.starting_price_cents, 0) >= $${paramCount}`; params.push(parseInt(minPrice) * 100); paramCount++; }
        if (maxPrice) { query += ` AND COALESCE(l.price_cents, l.starting_price_cents, 0) <= $${paramCount}`; params.push(parseInt(maxPrice) * 100); paramCount++; }
        
        if (lat && lng && radius) {
            query += ` AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL`;
            query += ` AND (6371 * acos(cos(radians($${paramCount})) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($${paramCount + 1})) + sin(radians($${paramCount})) * sin(radians(l.latitude)))) <= $${paramCount + 2}`;
            params.push(parseFloat(lat), parseFloat(lng), parseInt(radius));
            paramCount += 3;
        }
        
        switch(sort) {
            case 'price_low': query += ` ORDER BY COALESCE(l.price_cents, l.starting_price_cents, 0) ASC`; break;
            case 'price_high': query += ` ORDER BY COALESCE(l.price_cents, l.starting_price_cents, 0) DESC`; break;
            case 'ending_soon': query += ` ORDER BY l.auction_end_time ASC NULLS LAST`; break;
            default: query += ` ORDER BY l.is_featured DESC, l.created_at DESC`;
        }
        
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), offset);
        
        const result = await db.query(query, params);
        const total = result.rows[0]?.total_count || 0;
        
        res.json({ listings: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        console.error('Listings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single listing
router.get('/:id', async (req, res) => {
    try {
        const { lang } = req.query;
        const tl_title = (lang && lang !== 'en') ? `COALESCE(lt.title, l.title)` : `l.title`;
        const tl_desc = (lang && lang !== 'en') ? `COALESCE(lt.description, l.description)` : `l.description`;
        const tjoin = (lang && lang !== 'en') ? ` LEFT JOIN listing_translations lt ON lt.listing_id = l.id AND lt.language_code = '${(lang||'').replace(/[^a-z-]/g,'')}'` : '';
        const result = await db.query(`
            SELECT l.id, l.seller_id, l.store_id, l.type, ${tl_title} as title, ${tl_desc} as description, l.category, l.price_cents,
                   l.starting_price_cents, l.reserve_price_cents, l.buy_it_now_price_cents, l.current_bid_cents,
                   l.bid_increment_cents, l.reverse_target_specs, l.quantity_available, l.quantity_sold, l.images, l.video_url,
                   l.location_city, l.location_state, l.location_country, l.latitude, l.longitude,
                   l.is_local_pickup, l.shipping_options, l.inventory_tracking, l.status, l.approved_by, l.approved_at,
                   l.auction_end_time, l.created_at, l.updated_at, l.duration, l.expires_at,
                   l.min_bid_cents, l.max_bid_cents, l.bid_increment_percent, l.current_bidder_id, l.bid_count,
                   l.shipping_provider, l.shipping_tracking, l.weight_oz, l.dimensions,
                   l.deleted_at, l.deletion_reason, l.is_dutch_auction, l.dutch_clearing_price_cents,
                   l.allow_local_pickup, l.pickup_address, l.pickup_city, l.pickup_state, l.pickup_zip, l.pickup_instructions, l.pickup_country,
                   l.poster_role, l.item_condition, l.is_featured, l.source_language, l.currency, l.accepted_currencies,
                   u.email as seller_email, u.full_name as seller_name,
                   s.store_name, s.slug as store_slug,
                   (SELECT json_build_object('code', p.code, 'value_percent', p.value_percent, 'promotion_type', p.promotion_type) 
                    FROM promotions p 
                    WHERE (p.listing_id = l.id OR p.store_id = l.store_id) 
                      AND p.is_active = true 
                      AND (p.expires_at IS NULL OR p.expires_at > NOW())
                      AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
                    LIMIT 1) as promotion
            FROM listings l
            ${tjoin}
            LEFT JOIN users u ON l.seller_id = u.id
            LEFT JOIN stores s ON l.store_id = s.id
            WHERE l.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
        res.json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
