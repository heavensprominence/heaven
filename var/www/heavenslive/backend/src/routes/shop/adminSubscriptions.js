const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

const requireAdmin = async (req, res, next) => {
    const isAdmin = await db.query(
        'SELECT 1 FROM shop_admins WHERE user_id = $1 UNION SELECT 1 FROM users WHERE id = $1 AND is_super_admin = true',
        [req.userId]
    );
    if (isAdmin.rows.length === 0) return res.status(403).json({ error: 'Admin required' });
    next();
};

router.get('/plans', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM users WHERE current_plan_id = p.id) as subscriber_count
            FROM subscription_plans p
            ORDER BY p.sort_order
        `);
        res.json({ plans: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/plans', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, description, price_monthly_cents, price_yearly_cents, platform_fee_percent, features, is_active, sort_order } = req.body;
        const result = await db.query(`
            INSERT INTO subscription_plans (name, slug, description, price_monthly_cents, price_yearly_cents, platform_fee_percent, features, is_active, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [name, slug, description, price_monthly_cents, price_yearly_cents, platform_fee_percent, JSON.stringify(features), is_active, sort_order]);
        
        // Update all users on this plan with new limits (if editing)
        if (features) {
            await db.query(`
                UPDATE users 
                SET max_listings = $1, max_images_per_listing = $2, can_use_bulk_import = $3,
                    can_create_promotions = $4, can_customize_store = $5, can_view_analytics = $6,
                    featured_listings_count = $7, priority_support = $8
                WHERE current_plan_id = $9
            `, [features.max_listings, features.max_images, features.bulk_import, features.promotions,
                features.customization, features.analytics, features.featured_listings, features.priority_support, result.rows[0].id]);
        }
        
        res.status(201).json({ success: true, plan: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/plans/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price_monthly_cents, price_yearly_cents, platform_fee_percent, features, is_active, sort_order } = req.body;
        
        await db.query(`
            UPDATE subscription_plans 
            SET name=$1, slug=$2, description=$3, price_monthly_cents=$4, price_yearly_cents=$5,
                platform_fee_percent=$6, features=$7, is_active=$8, sort_order=$9, updated_at=NOW()
            WHERE id=$10
        `, [name, slug, description, price_monthly_cents, price_yearly_cents, platform_fee_percent, JSON.stringify(features), is_active, sort_order, id]);
        
        // Update all users on this plan with new limits
        await db.query(`
            UPDATE users 
            SET max_listings = $1, max_images_per_listing = $2, can_use_bulk_import = $3,
                can_create_promotions = $4, can_customize_store = $5, can_view_analytics = $6,
                featured_listings_count = $7, priority_support = $8
            WHERE current_plan_id = $9
        `, [features.max_listings, features.max_images, features.bulk_import, features.promotions,
            features.customization, features.analytics, features.featured_listings, features.priority_support, id]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/plans/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const subscribers = await db.query('SELECT COUNT(*) FROM users WHERE current_plan_id = $1', [id]);
        if (parseInt(subscribers.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Cannot delete plan with active subscribers' });
        }
        await db.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
