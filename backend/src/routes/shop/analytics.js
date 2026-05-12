const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Admin: Get platform overview
router.get('/admin/overview', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        const isAdmin = await db.query(
            'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
            [userId]
        );
        if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
        
        const { period = '30d' } = req.query;
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        
        // Overall stats
        const stats = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '${days} days') as new_users,
                (SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '${days} days') as new_listings,
                (SELECT COUNT(*) FROM purchases WHERE created_at > NOW() - INTERVAL '${days} days') as total_sales,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM purchases WHERE created_at > NOW() - INTERVAL '${days} days') as revenue_cents,
                (SELECT COALESCE(SUM(platform_fee_cents), 0) FROM purchases WHERE created_at > NOW() - INTERVAL '${days} days') as fee_revenue,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
                (SELECT COUNT(*) FROM stores) as total_stores
        `);
        
        // Daily trend
        const trend = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales,
                COALESCE(SUM(amount_cents), 0) as revenue
            FROM purchases
            WHERE created_at > NOW() - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        
        // Top categories
        const categories = await db.query(`
            SELECT 
                category,
                COUNT(*) as listings,
                COALESCE(SUM(p.amount_cents), 0) as revenue
            FROM listings l
            LEFT JOIN purchases p ON l.id = p.listing_id AND p.created_at > NOW() - INTERVAL '${days} days'
            WHERE l.created_at > NOW() - INTERVAL '${days} days'
            GROUP BY category
            ORDER BY revenue DESC
            LIMIT 10
        `);
        
        // Top sellers
        const topSellers = await db.query(`
            SELECT 
                u.id, u.full_name, u.email,
                COUNT(p.id) as sales,
                COALESCE(SUM(p.amount_cents), 0) as revenue
            FROM users u
            JOIN listings l ON u.id = l.seller_id
            LEFT JOIN purchases p ON l.id = p.listing_id AND p.created_at > NOW() - INTERVAL '${days} days'
            GROUP BY u.id, u.full_name, u.email
            ORDER BY revenue DESC
            LIMIT 10
        `);
        
        res.json({
            period: days,
            stats: stats.rows[0],
            trend: trend.rows,
            categories: categories.rows,
            topSellers: topSellers.rows
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Seller: Get personal analytics
router.get('/seller', verifyToken, async (req, res) => {
    try {
        const sellerId = req.userId;
        const { period = '30d' } = req.query;
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        
        // Overall seller stats
        const stats = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '${days} days') as new_listings,
                (SELECT COUNT(*) FROM listings WHERE seller_id = $1 AND status = 'active') as active_listings,
                (SELECT COUNT(*) FROM purchases WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '${days} days') as sales_count,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM purchases WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '${days} days') as revenue_cents,
                (SELECT COALESCE(AVG(amount_cents), 0) FROM purchases WHERE seller_id = $1) as avg_sale_value,
                (SELECT COUNT(DISTINCT buyer_id) FROM purchases WHERE seller_id = $1) as unique_buyers
        `, [sellerId]);
        
        // Daily sales trend
        const trend = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sales,
                COALESCE(SUM(amount_cents), 0) as revenue
            FROM purchases
            WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [sellerId]);
        
        // Top selling items
        const topItems = await db.query(`
            SELECT 
                l.id, l.title, l.images[1] as image,
                COUNT(p.id) as sales,
                COALESCE(SUM(p.amount_cents), 0) as revenue
            FROM listings l
            LEFT JOIN purchases p ON l.id = p.listing_id
            WHERE l.seller_id = $1
            GROUP BY l.id, l.title, l.images
            ORDER BY revenue DESC
            LIMIT 5
        `, [sellerId]);
        
        // Category breakdown
        const categories = await db.query(`
            SELECT 
                l.category,
                COUNT(DISTINCT l.id) as listings,
                COUNT(p.id) as sales,
                COALESCE(SUM(p.amount_cents), 0) as revenue
            FROM listings l
            LEFT JOIN purchases p ON l.id = p.listing_id
            WHERE l.seller_id = $1
            GROUP BY l.category
            ORDER BY revenue DESC
        `, [sellerId]);
        
        // Views and conversion
        const views = await db.query(`
            SELECT 
                COUNT(*) as total_views,
                COUNT(DISTINCT viewer_id) as unique_viewers
            FROM listing_views v
            JOIN listings l ON v.listing_id = l.id
            WHERE l.seller_id = $1 AND v.created_at > NOW() - INTERVAL '${days} days'
        `, [sellerId]);
        
        const conversion = stats.rows[0]?.sales_count > 0 && views.rows[0]?.total_views > 0
            ? ((stats.rows[0].sales_count / views.rows[0].total_views) * 100).toFixed(2)
            : 0;
        
        res.json({
            period: days,
            stats: { ...stats.rows[0], ...views.rows[0], conversion_rate: conversion },
            trend: trend.rows,
            topItems: topItems.rows,
            categories: categories.rows
        });
    } catch (error) {
        console.error('Seller analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get popular categories (public)
router.get('/popular-categories', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                category,
                COUNT(*) as listing_count,
                COALESCE(SUM(p.amount_cents), 0) as revenue
            FROM listings l
            LEFT JOIN purchases p ON l.id = p.listing_id
            WHERE l.status = 'active'
            GROUP BY category
            ORDER BY listing_count DESC
            LIMIT 10
        `);
        
        res.json({ categories: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trending items (public)
router.get('/trending', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                l.id, l.title, l.price_cents, l.images[1] as image,
                COUNT(v.id) as views,
                COUNT(p.id) as sales
            FROM listings l
            LEFT JOIN listing_views v ON l.id = v.listing_id AND v.created_at > NOW() - INTERVAL '7 days'
            LEFT JOIN purchases p ON l.id = p.listing_id AND p.created_at > NOW() - INTERVAL '7 days'
            WHERE l.status = 'active'
            GROUP BY l.id, l.title, l.price_cents, l.images
            ORDER BY views DESC, sales DESC
            LIMIT 12
        `);
        
        res.json({ trending: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
