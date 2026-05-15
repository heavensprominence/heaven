const { parse } = require('csv-parse');
const { autoTranslateListing } = require("./translationService");
const fs = require('fs');
const db = require('../db');

// Expected CSV headers
const EXPECTED_HEADERS = [
    'type', 'title', 'description', 'category', 'price', 'quantity',
    'duration', 'store_name', 'allow_pickup', 'pickup_address',
    'pickup_city', 'pickup_state', 'pickup_zip', 'pickup_country',
    'location_city', 'location_state', 'location_country',
];

// Listing type mapping
const LISTING_TYPES = ['mall', 'classifieds', 'auction', 'procurement'];

// Duration mapping
const DURATION_MAP = {
    '1day': '1day',
    '2weeks': '2weeks',
    '1year': '1year',
    'forever': 'forever'
};

async function processBulkImport(userId, filePath, storeMap = {}) {
    const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: []
    };

    return new Promise((resolve, reject) => {
        const listings = [];
        const parser = fs.createReadStream(filePath).pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true
        }));

        parser.on('data', (row) => {
            listings.push(row);
        });

        parser.on('end', async () => {
            results.total = listings.length;
            
            for (let i = 0; i < listings.length; i++) {
                try {
                    const row = listings[i];
                    const listing = await processListingRow(userId, row, storeMap, i + 1);
                    
                    if (listing.valid) {
                        const insertedListing = await insertListing(userId, listing.data);
                        autoTranslateListing(insertedListing.id).catch(err => console.error("Bulk auto-translate error:", err.message));
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push({ row: i + 1, error: listing.error });
                    }
                } catch (err) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: err.message });
                }
            }
            
            // Clean up temp file
            fs.unlinkSync(filePath);
            resolve(results);
        });

        parser.on('error', (err) => {
            fs.unlinkSync(filePath);
            reject(err);
        });
    });
}

function processListingRow(userId, row, storeMap, rowNum) {
    const errors = [];
    
    // Validate type
    if (!row.type || !LISTING_TYPES.includes(row.type.toLowerCase())) {
        errors.push(`Invalid type: must be ${LISTING_TYPES.join(', ')}`);
    }
    
    // Validate title
    if (!row.title || row.title.length < 3) {
        errors.push('Title must be at least 3 characters');
    }
    
    // Validate price
    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
        errors.push('Price must be a valid number >= 0');
    }
    
    // Validate quantity
    const quantity = parseInt(row.quantity) || 1;
    if (quantity < 1) {
        errors.push('Quantity must be at least 1');
    }
    
    // Validate duration
    const duration = row.duration?.toLowerCase() || '2weeks';
    if (!DURATION_MAP[duration]) {
        errors.push(`Invalid duration: use ${Object.keys(DURATION_MAP).join(', ')}`);
    }
    
    if (errors.length > 0) {
        return { valid: false, error: errors.join('; ') };
    }
    
    // Process store
    let storeId = null;
    if (row.store_name && storeMap[row.store_name]) {
        storeId = storeMap[row.store_name];
    }
    
    // Process images (comma-separated URLs)
    const images = row.images ? row.images.split(',').map(u => u.trim()).filter(u => u) : [];
    
    // Process dimensions
    const dimensions = {
        length: parseFloat(row.length) || 12,
        width: parseFloat(row.width) || 12,
        height: parseFloat(row.height) || 12
    };
    
    // Calculate expiration
    let expiresAt = null;
    const now = new Date();
    if (duration === '1day') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    else if (duration === '2weeks') expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    else if (duration === '1year') expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    const listingData = {
        type: row.type.toLowerCase(),
        title: row.title,
        description: row.description || '',
        category: row.category || 'other',
        price_cents: Math.round(price * 100),
        quantity_available: quantity,
        duration: duration,
        store_id: storeId,
        allow_local_pickup: row.allow_pickup?.toLowerCase() === 'yes' || row.allow_pickup?.toLowerCase() === 'true',
        pickup_address: row.pickup_address || null,
        pickup_city: row.pickup_city || null,
        pickup_state: row.pickup_state || null,
        pickup_zip: row.pickup_zip || null,
        pickup_country: row.pickup_country || 'CA',
        location_city: row.location_city || '',
        location_state: row.location_state || '',
        location_country: row.location_country || 'CA',
        weight_oz: parseFloat(row.weight_oz) || null,
        dimensions: dimensions,
        images: images,
        expires_at: expiresAt,
        status: 'pending_approval',
        language_code: row.language_code || null,
    };
    
    // Set auction-specific fields
    if (listingData.type === 'auction') {
        listingData.min_bid_cents = listingData.price_cents;
        listingData.price_cents = 0;
    } else if (listingData.type === 'procurement') {
        listingData.max_bid_cents = listingData.price_cents;
        listingData.price_cents = 0;
    }
    
    return { valid: true, data: listingData };
}

async function insertListing(userId, data) {
    const result = await db.query(`
        INSERT INTO listings (
            seller_id, type, title, description, category, price_cents,
            min_bid_cents, max_bid_cents, quantity_available, duration,
            store_id, allow_local_pickup, pickup_address, pickup_city,
            pickup_state, pickup_zip, pickup_country, location_city,
            location_state, location_country, weight_oz, dimensions,
            images, expires_at, auction_end_time, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING id
    `, [
        userId, data.type, data.title, data.description, data.category,
        data.price_cents || 0, data.min_bid_cents, data.max_bid_cents,
        data.quantity_available, data.duration, data.store_id,
        data.allow_local_pickup, data.pickup_address, data.pickup_city,
        data.pickup_state, data.pickup_zip, data.pickup_country,
        data.location_city, data.location_state, data.location_country,
        data.weight_oz, JSON.stringify(data.dimensions), data.images,
        data.expires_at, data.expires_at, data.status
    ]);
    
    return result.rows[0];
}

// Generate CSV template
function generateTemplate() {
    return EXPECTED_HEADERS.join(',') + '\n' +
        'mall,Example Product,This is a sample description,electronics,99.99,5,2weeks,MyStore,yes,123 Main St,Toronto,ON,M5V2T6,CA,Toronto,ON,CA,16,12,12,12,https://imgur.com/example1.jpg,en\n' +
        'auction,Vintage Item,Auction example,collectibles,50.00,1,1day,,no,,,,,,Toronto,ON,CA,16,12,12,12,https://drive.google.com/example2.jpg,fr\n' +
        'classifieds,Free Item,Free giveaway,other,0,1,2weeks,,yes,456 Oak Ave,Ottawa,ON,K1A0B1,CA,Ottawa,ON,CA,16,12,12,12,https://imgur.com/example3.jpg,es\n' +
        'procurement,Need Developer,Looking for React developer,services,2000.00,1,1year,,no,,,,,,Toronto,ON,CA,16,12,12,12,https://drive.google.com/example4.jpg,de';
}

module.exports = { processBulkImport, generateTemplate };
