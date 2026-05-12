const db = require('../db');
const { sendProcurementMatchAlert, sendSavedSearchAlert } = require('./emailService');

// Calculate match score between procurement and listing
function calculateMatchScore(procurement, listing) {
    let score = 0;
    const reasons = [];
    
    // Category match (40 points)
    if (procurement.category === listing.category) {
        score += 40;
        reasons.push('Same category');
    } else {
        // Partial category match (20 points)
        const procCat = procurement.category?.split('_')[0];
        const listCat = listing.category?.split('_')[0];
        if (procCat === listCat) {
            score += 20;
            reasons.push('Related category');
        }
    }
    
    // Location match (20 points)
    if (procurement.location_city === listing.location_city && 
        procurement.location_state === listing.location_state) {
        score += 20;
        reasons.push('Same location');
    }
    
    // Price match (40 points) - procurement budget >= listing price
    const budget = procurement.max_bid_cents || procurement.price_cents;
    const price = listing.price_cents || listing.min_bid_cents;
    if (budget && price && budget >= price) {
        const priceRatio = price / budget;
        if (priceRatio <= 0.8) {
            score += 40;
            reasons.push('Great price match (under budget)');
        } else if (priceRatio <= 1.0) {
            score += 30;
            reasons.push('Within budget');
        } else if (priceRatio <= 1.2) {
            score += 15;
            reasons.push('Slightly over budget');
        }
    }
    
    // Keyword match in title/description (extra 10 points)
    const keywords = procurement.title?.toLowerCase().split(/\s+/) || [];
    const listingText = (listing.title + ' ' + listing.description).toLowerCase();
    const matchCount = keywords.filter(kw => kw.length > 3 && listingText.includes(kw)).length;
    if (matchCount > 0) {
        score += Math.min(10, matchCount * 2);
        if (matchCount >= 3) reasons.push('Keyword match');
    }
    
    return { score: Math.min(100, score), reasons: reasons.join('; ') };
}

// Find matches for a new procurement listing
async function findMatchesForProcurement(procurementId) {
    try {
        const procurement = await db.query('SELECT * FROM listings WHERE id = $1 AND type = $2', 
            [procurementId, 'reverse_auction']);
        if (procurement.rows.length === 0) return [];
        
        const proc = procurement.rows[0];
        
        // Find potential matching listings (mall, classifieds, auction)
        const potentialMatches = await db.query(`
            SELECT * FROM listings 
            WHERE status = 'active' 
              AND type IN ('mall', 'classifieds', 'auction')
              AND seller_id != $1
              AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 100
        `, [proc.seller_id]);
        
        const matches = [];
        for (const listing of potentialMatches.rows) {
            const { score, reasons } = calculateMatchScore(proc, listing);
            if (score >= 50) { // Only keep good matches
                const result = await db.query(`
                    INSERT INTO procurement_matches (procurement_id, matching_listing_id, match_score, match_reason)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (procurement_id, matching_listing_id) DO UPDATE 
                    SET match_score = $3, match_reason = $4
                    RETURNING *
                `, [procurementId, listing.id, score, reasons]);
                matches.push({ ...result.rows[0], listing });
            }
        }
        
        return matches;
    } catch (error) {
        console.error('Find matches error:', error);
        return [];
    }
}

// Find procurement matches for a new listing
async function findProcurementsForListing(listingId) {
    try {
        const listing = await db.query('SELECT * FROM listings WHERE id = $1', [listingId]);
        if (listing.rows.length === 0) return [];
        
        const list = listing.rows[0];
        if (list.type === 'reverse_auction') return []; // Don't match procurement with procurement
        
        // Find procurement listings that might want this
        const procurements = await db.query(`
            SELECT * FROM listings 
            WHERE status = 'active' 
              AND type = 'reverse_auction'
              AND seller_id != $1
              AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 100
        `, [list.seller_id]);
        
        const matches = [];
        for (const proc of procurements.rows) {
            const { score, reasons } = calculateMatchScore(proc, list);
            if (score >= 50) {
                const result = await db.query(`
                    INSERT INTO procurement_matches (procurement_id, matching_listing_id, match_score, match_reason)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (procurement_id, matching_listing_id) DO UPDATE 
                    SET match_score = $3, match_reason = $4
                    RETURNING *
                `, [proc.id, listingId, score, reasons]);
                matches.push({ ...result.rows[0], procurement: proc });
            }
        }
        
        return matches;
    } catch (error) {
        console.error('Find procurements error:', error);
        return [];
    }
}

// Check saved searches against new listing
async function checkSavedSearches(listingId) {
    try {
        const listing = await db.query('SELECT * FROM listings WHERE id = $1', [listingId]);
        if (listing.rows.length === 0) return;
        
        const list = listing.rows[0];
        const savedSearches = await db.query(`
            SELECT * FROM saved_searches 
            WHERE is_active = TRUE 
              AND (last_notified_at IS NULL OR last_notified_at < NOW() - INTERVAL '1 hour')
        `);
        
        for (const search of savedSearches.rows) {
            const filters = search.filters;
            let matches = true;
            
            // Check filters against listing
            if (filters.category && filters.category !== list.category) matches = false;
            if (filters.type && filters.type !== list.type) matches = false;
            if (filters.minPrice && list.price_cents < filters.minPrice * 100) matches = false;
            if (filters.maxPrice && list.price_cents > filters.maxPrice * 100) matches = false;
            if (filters.condition && filters.condition !== list.item_condition) matches = false;
            if (filters.keywords) {
                const kw = filters.keywords.toLowerCase();
                const text = (list.title + ' ' + list.description).toLowerCase();
                if (!text.includes(kw)) matches = false;
            }
            
            if (matches) {
                await db.query(`
                    INSERT INTO search_matches (saved_search_id, listing_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [search.id, listingId]);
            }
        }
    } catch (error) {
        console.error('Check saved searches error:', error);
    }
}

// Send pending notifications
async function sendPendingNotifications() {
    try {
        // Send procurement match alerts
        const pendingProcurementMatches = await db.query(`
            SELECT pm.*, 
                   p.title as procurement_title, p.seller_id as buyer_id,
                   l.title as listing_title, l.seller_id as seller_id,
                   u_buyer.email as buyer_email, u_buyer.full_name as buyer_name,
                   u_seller.email as seller_email, u_seller.full_name as seller_name
            FROM procurement_matches pm
            JOIN listings p ON pm.procurement_id = p.id
            JOIN listings l ON pm.matching_listing_id = l.id
            JOIN users u_buyer ON p.seller_id = u_buyer.id
            JOIN users u_seller ON l.seller_id = u_seller.id
            WHERE (pm.notified_buyer = FALSE OR pm.notified_seller = FALSE)
              AND pm.match_score >= 60
            LIMIT 50
        `);
        
        for (const match of pendingProcurementMatches.rows) {
            if (!match.notified_buyer) {
                await sendProcurementMatchAlert(match.buyer_email, match.buyer_name, match);
                await db.query('UPDATE procurement_matches SET notified_buyer = TRUE WHERE id = $1', [match.id]);
            }
            if (!match.notified_seller) {
                await sendProcurementMatchAlert(match.seller_email, match.seller_name, match);
                await db.query('UPDATE procurement_matches SET notified_seller = TRUE WHERE id = $1', [match.id]);
            }
        }
        
        // Send saved search alerts
        const pendingSearches = await db.query(`
            SELECT sm.*, ss.user_id, ss.name, u.email, u.full_name, l.title, l.price_cents, l.images
            FROM search_matches sm
            JOIN saved_searches ss ON sm.saved_search_id = ss.id
            JOIN users u ON ss.user_id = u.id
            JOIN listings l ON sm.listing_id = l.id
            WHERE sm.notified_at IS NULL
            LIMIT 50
        `);
        
        for (const alert of pendingSearches.rows) {
            await sendSavedSearchAlert(alert.email, alert.full_name, alert);
            await db.query('UPDATE search_matches SET notified_at = NOW() WHERE id = $1', [alert.id]);
            await db.query('UPDATE saved_searches SET last_notified_at = NOW() WHERE id = $1', [alert.saved_search_id]);
        }
        
        console.log(`Sent ${pendingProcurementMatches.rows.length} procurement matches and ${pendingSearches.rows.length} search alerts`);
    } catch (error) {
        console.error('Send notifications error:', error);
    }
}

module.exports = {
    findMatchesForProcurement,
    findProcurementsForListing,
    checkSavedSearches,
    sendPendingNotifications,
    calculateMatchScore
};
