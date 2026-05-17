const db = require('../db');

async function getUserPlan(userId) {
    try {
        const result = await db.query(`
            SELECT 
                u.current_plan_id,
                u.max_listings,
                u.max_images_per_listing,
                u.can_use_bulk_import,
                u.can_create_promotions,
                u.can_customize_store,
                u.can_view_analytics,
                u.featured_listings_count,
                u.priority_support,
                p.name as plan_name, 
                p.slug as plan_slug, 
                p.platform_fee_percent,
                p.features
            FROM users u
            LEFT JOIN subscription_plans p ON u.current_plan_id = p.id
            WHERE u.id = $1
        `, [userId]);
        
        if (result.rows.length === 0) return null;
        
        const user = result.rows[0];
        const features = user.features || {};
        
        const currentListings = await getCurrentListingsCount(userId);
        const currentFeatured = await getCurrentFeaturedCount(userId);
        
        // Fetch user's store
        let store = null;
        try {
            const storeResult = await db.query('SELECT id, store_name, slug FROM stores WHERE seller_id = $1 AND is_active = true LIMIT 1', [userId]);
            if (storeResult.rows.length > 0) store = storeResult.rows[0];
        } catch(e) {}
        
        return {
            planId: user.current_plan_id,
            planName: user.plan_name || 'Free',
            planSlug: user.plan_slug || 'free',
            platformFeePercent: parseFloat(user.platform_fee_percent) || 17.0,
            limits: {
                maxListings: user.max_listings || features.max_listings || 5,
                maxImages: user.max_images_per_listing || features.max_images || 3,
                bulkImport: user.can_use_bulk_import || features.bulk_import || false,
                promotions: user.can_create_promotions || features.promotions || false,
                customization: user.can_customize_store || features.customization || false,
                analytics: user.can_view_analytics || features.analytics || false,
                featuredListings: user.featured_listings_count || features.featured_listings || 0,
                prioritySupport: user.priority_support || features.priority_support || false
            },
            usage: {
                currentListings: currentListings,
                currentFeatured: currentFeatured
            },
            store: store
        };
    } catch (error) {
        console.error('Get user plan error:', error);
        return {
            planName: 'Free',
            planSlug: 'free',
            platformFeePercent: 17.0,
            limits: { maxListings: 5, maxImages: 3 },
            usage: { currentListings: 0, currentFeatured: 0 }
        };
    }
}

async function getCurrentListingsCount(userId) {
    const result = await db.query(
        "SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND status = 'active'",
        [userId]
    );
    return parseInt(result.rows[0].count) || 0;
}

async function getCurrentFeaturedCount(userId) {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND status = 'active' AND is_featured = true",
            [userId]
        );
        return parseInt(result.rows[0].count) || 0;
    } catch (e) {
        return 0;
    }
}

async function canCreateListing(userId) {
    const plan = await getUserPlan(userId);
    if (!plan) return { allowed: false, reason: 'User not found' };
    
    const maxListings = plan.limits.maxListings;
    if (maxListings === -1) return { allowed: true };
    
    const currentCount = plan.usage.currentListings;
    if (currentCount >= maxListings) {
        return { allowed: false, reason: `You've reached your limit of ${maxListings} listings. Upgrade to add more!` };
    }
    return { allowed: true };
}

async function applyPlanToUser(userId, planId) {
    const plan = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (plan.rows.length === 0) return false;
    const p = plan.rows[0];
    const features = p.features || {};
    
    await db.query(`
        UPDATE users SET 
            current_plan_id = $1,
            max_listings = $2,
            max_images_per_listing = $3,
            can_use_bulk_import = $4,
            can_create_promotions = $5,
            can_customize_store = $6,
            can_view_analytics = $7,
            featured_listings_count = $8,
            priority_support = $9
        WHERE id = $10
    `, [
        planId,
        features.max_listings || 10,
        features.max_images || 3,
        features.bulk_import || false,
        features.promotions || false,
        features.customization || false,
        features.analytics || false,
        features.featured_listings || 0,
        features.priority_support || false,
        userId
    ]);
    return true;
}

async function getPlans() {
    const result = await db.query(
        'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY sort_order'
    );
    return result.rows;
}

async function getSellerPlatformFee(sellerId) {
    const user = await db.query(
        'SELECT p.platform_fee_percent FROM users u LEFT JOIN subscription_plans p ON u.current_plan_id = p.id WHERE u.id = $1',
        [sellerId]
    );
    return parseFloat(user.rows[0]?.platform_fee_percent) || 17.0;
}

module.exports = {
    getUserPlan,
    canCreateListing,
    applyPlanToUser,
    getPlans,
    getSellerPlatformFee
};
