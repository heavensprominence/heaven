const db = require('../db');

// Get predictive insights for a seller
async function getPredictiveInsights(sellerId, category = null) {
    try {
        // Get seller's current listings and sales
        const sellerStats = await db.query(`
            SELECT 
                l.category,
                COUNT(DISTINCT l.id) as active_listings,
                COALESCE(AVG(l.price_cents), 0) as avg_price,
                COALESCE(SUM(p.amount_cents), 0) as total_revenue,
                COUNT(p.id) as total_sales
            FROM listings l
            LEFT JOIN purchases p ON l.id = p.listing_id AND p.created_at > NOW() - INTERVAL '90 days'
            WHERE l.seller_id = $1 AND l.status = 'active'
            ${category ? "AND l.category = $2" : ""}
            GROUP BY l.category
        `, category ? [sellerId, category] : [sellerId]);
        
        // Get market-wide data for comparison
        const marketData = await db.query(`
            SELECT 
                category,
                COUNT(DISTINCT id) as total_listings,
                AVG(price_cents) as market_avg_price,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_cents) as market_median_price
            FROM listings
            WHERE status = 'active'
            GROUP BY category
        `);
        
        // Get competitor insights
        const competitorInsights = await db.query(`
            WITH competitor_prices AS (
                SELECT 
                    category,
                    AVG(price_cents) as competitor_avg,
                    COUNT(*) as competitor_count
                FROM listings 
                WHERE status = 'active' AND seller_id != $1
                GROUP BY category
            )
            SELECT 
                c.*,
                CASE 
                    WHEN s.avg_price < c.competitor_avg * 0.8 THEN 'below_average'
                    WHEN s.avg_price > c.competitor_avg * 1.2 THEN 'premium'
                    WHEN s.avg_price BETWEEN c.competitor_avg * 0.8 AND c.competitor_avg * 1.2 THEN 'average'
                    ELSE 'above_average'
                END as price_position,
                ROUND((s.total_sales::decimal / NULLIF(c.competitor_count, 0)) * 100, 2) as estimated_market_share
            FROM (${sellerStats.text}) s
            LEFT JOIN competitor_prices c ON s.category = c.category
        `, [sellerId]);
        
        // Generate recommendations
        const recommendations = [];
        for (const row of competitorInsights.rows) {
            if (row.price_position === 'below_average' && row.active_listings > 0) {
                recommendations.push({
                    category: row.category,
                    type: 'pricing',
                    insight: `Your prices are ${Math.round((1 - row.avg_price/row.competitor_avg) * 100)}% below market average`,
                    action: 'Consider raising prices to increase profit margins',
                    potential_gain: Math.round(row.active_listings * (row.competitor_avg - row.avg_price) / 100)
                });
            } else if (row.price_position === 'premium') {
                recommendations.push({
                    category: row.category,
                    type: 'pricing',
                    insight: 'Your items are priced at premium levels',
                    action: 'Highlight quality and unique features in descriptions',
                    potential_gain: null
                });
            }
            
            if (row.active_listings === 0 && row.competitor_count > 10) {
                recommendations.push({
                    category: row.category,
                    type: 'opportunity',
                    insight: `High-demand category with ${row.competitor_count} active listings`,
                    action: 'Consider listing items in this category',
                    potential_gain: Math.round(row.competitor_avg / 100)
                });
            }
        }
        
        return {
            sellerStats: sellerStats.rows,
            marketComparison: marketData.rows,
            competitorInsights: competitorInsights.rows,
            recommendations,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Predictive insights error:', error);
        return null;
    }
}

// Get market trends with predictions
async function getMarketTrends(category = null, days = 30) {
    try {
        const trends = await db.query(`
            WITH daily_stats AS (
                SELECT 
                    DATE(created_at) as date,
                    category,
                    COUNT(*) as listings_added,
                    AVG(price_cents) as avg_price
                FROM listings
                WHERE created_at > NOW() - INTERVAL '${days} days'
                ${category ? "AND category = $1" : ""}
                GROUP BY DATE(created_at), category
            ),
            sales_stats AS (
                SELECT 
                    DATE(p.created_at) as date,
                    l.category,
                    COUNT(*) as sales_count,
                    AVG(p.amount_cents) as avg_sale_price
                FROM purchases p
                JOIN listings l ON p.listing_id = l.id
                WHERE p.created_at > NOW() - INTERVAL '${days} days'
                ${category ? "AND l.category = $1" : ""}
                GROUP BY DATE(p.created_at), l.category
            )
            SELECT 
                COALESCE(d.date, s.date) as date,
                COALESCE(d.category, s.category) as category,
                COALESCE(d.listings_added, 0) as new_listings,
                COALESCE(s.sales_count, 0) as sales,
                ROUND(COALESCE(d.avg_price, 0)) as avg_listing_price,
                ROUND(COALESCE(s.avg_sale_price, 0)) as avg_sale_price,
                CASE 
                    WHEN COALESCE(d.listings_added, 0) > 0 AND COALESCE(s.sales_count, 0) > 0 
                    THEN ROUND((s.sales_count::decimal / d.listings_added) * 100, 1)
                    ELSE 0
                END as sell_through_rate
            FROM daily_stats d
            FULL OUTER JOIN sales_stats s ON d.date = s.date AND d.category = s.category
            ORDER BY date DESC, category
        `, category ? [category] : []);
        
        // Simple prediction based on moving average
        const predictions = [];
        const categories = [...new Set(trends.rows.map(t => t.category))];
        
        for (const cat of categories) {
            const catData = trends.rows.filter(t => t.category === cat).slice(0, 7);
            if (catData.length >= 3) {
                const avgPrice = catData.reduce((sum, d) => sum + parseFloat(d.avg_sale_price || d.avg_listing_price), 0) / catData.length;
                const trend = catData[0].avg_sale_price > catData[catData.length-1].avg_sale_price ? 'rising' : 'falling';
                
                predictions.push({
                    category: cat,
                    predicted_price: Math.round(avgPrice * (trend === 'rising' ? 1.05 : 0.95)),
                    confidence: Math.min(70 + catData.length * 5, 95),
                    best_time_to_sell: getBestTimeToSell(cat),
                    expected_demand: catData[0].sell_through_rate > 50 ? 'high' : 'moderate'
                });
            }
        }
        
        return { trends: trends.rows, predictions };
    } catch (error) {
        console.error('Market trends error:', error);
        return { trends: [], predictions: [] };
    }
}

function getBestTimeToSell(category) {
    const seasonalMap = {
        'electronics': 'November-December',
        'fashion': 'March-April, September-October',
        'home_garden': 'April-June',
        'collectibles': 'Year-round',
        'vehicles': 'March-August'
    };
    return seasonalMap[category] || 'Year-round';
}

// Get seller performance score
async function getSellerPerformanceScore(sellerId) {
    try {
        const metrics = await db.query(`
            SELECT 
                (SELECT COALESCE(AVG(rating), 0) FROM ratings WHERE reviewee_id = $1) as avg_rating,
                (SELECT COUNT(*) FROM purchases WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '30 days') as recent_sales,
                (SELECT AVG(EXTRACT(EPOCH FROM (shipped_at - created_at))/3600) FROM purchases WHERE seller_id = $1 AND shipped_at IS NOT NULL) as avg_ship_time_hours,
                (SELECT COUNT(*) FROM messages m JOIN listings l ON m.listing_id = l.id WHERE l.seller_id = $1 AND m.is_read = false) as pending_messages
        `, [sellerId]);
        
        const m = metrics.rows[0];
        let score = 50;
        if (m.avg_rating >= 4.5) score += 20;
        else if (m.avg_rating >= 4.0) score += 10;
        if (m.recent_sales >= 10) score += 15;
        else if (m.recent_sales >= 5) score += 10;
        if (m.avg_ship_time_hours < 24) score += 10;
        if (m.pending_messages === 0) score += 5;
        
        return {
            score: Math.min(100, score),
            rating: parseFloat(m.avg_rating).toFixed(1),
            recentSales: m.recent_sales,
            avgShipTime: m.avg_ship_time_hours ? Math.round(m.avg_ship_time_hours) + ' hours' : 'N/A',
            pendingMessages: m.pending_messages
        };
    } catch (error) {
        console.error('Performance score error:', error);
        return { score: 50, rating: '0.0', recentSales: 0, avgShipTime: 'N/A', pendingMessages: 0 };
    }
}

module.exports = {
    getPredictiveInsights,
    getMarketTrends,
    getSellerPerformanceScore
};
