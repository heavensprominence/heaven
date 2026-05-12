const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

// Middleware: Check if user is shop admin or super admin
const isShopAdmin = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        // Super admin always has access
        if (req.isSuperAdmin) {
            return next();
        }
        
        // Check shop_admins table
        const result = await db.query(
            'SELECT * FROM shop_admins WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Shop admin access required' });
        }
        
        req.shopAdminPermissions = result.rows[0].permissions;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Apply auth middleware to all routes
router.use(verifyToken);
router.use(isShopAdmin);

// ============================================
// DASHBOARD STATS
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM listings WHERE status = 'pending_approval') as pending_listings,
                (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
                (SELECT COUNT(*) FROM users WHERE is_suspended = true) as suspended_users,
                (SELECT COUNT(*) FROM orders WHERE escrow_status = 'disputed') as open_disputes,
                (SELECT COALESCE(SUM(amount_cents), 0) FROM fee_transactions 
                 WHERE collected_at > NOW() - INTERVAL '30 days') as revenue_30d_cents,
                (SELECT json_agg(row_to_json(t)) FROM (
                    SELECT DATE(created_at) as date, COUNT(*) as count
                    FROM listings
                    WHERE created_at > NOW() - INTERVAL '7 days'
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                ) t) as listings_7d,
                (SELECT json_agg(row_to_json(t)) FROM (
                    SELECT type, COUNT(*) as count
                    FROM listings
                    WHERE status = 'active'
                    GROUP BY type
                ) t) as listings_by_type
        `);
        
        res.json({ stats: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// LISTING APPROVAL
// ============================================
router.get('/listings/pending', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await db.query(`
            SELECT l.*, u.email as seller_email, u.full_name as seller_name,
                   COUNT(*) OVER() as total_count
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.status = 'pending_approval'
            ORDER BY l.created_at ASC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const total = result.rows[0]?.total_count || 0;
        
        res.json({
            listings: result.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/listings/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        await db.query('BEGIN');
        
        const result = await db.query(`
            UPDATE listings 
            SET status = 'active', approved_by = $1, approved_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [req.userId, id]);
        
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Listing not found' });
        }
        
        // Log the action
        await db.query(`
            INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
            VALUES ($1, $2, $3, $4, $5)
        `, [req.userId, 'approve_listing', 'listing', id, JSON.stringify({ notes })]);
        
        await db.query('COMMIT');
        
        res.json({ success: true, listing: result.rows[0] });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

router.post('/listings/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        await db.query('BEGIN');
        
        const result = await db.query(`
            UPDATE listings 
            SET status = 'rejected', approved_by = $1
            WHERE id = $2
            RETURNING *
        `, [req.userId, id]);
        
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Listing not found' });
        }
        
        await db.query(`
            INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
            VALUES ($1, $2, $3, $4, $5)
        `, [req.userId, 'reject_listing', 'listing', id, JSON.stringify({ reason })]);
        
        await db.query('COMMIT');
        
        res.json({ success: true });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// USER MANAGEMENT
// ============================================
router.get('/users', async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT u.id, u.email, u.full_name, u.is_suspended, u.suspension_end_date,
                   u.created_at, COUNT(*) OVER() as total_count,
                   (SELECT COUNT(*) FROM listings WHERE seller_id = u.id) as listing_count,
                   (SELECT COUNT(*) FROM orders WHERE seller_id = u.id) as sales_count
            FROM users u
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ` AND (u.email ILIKE $${params.length + 1} OR u.full_name ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        const total = result.rows[0]?.total_count || 0;
        
        res.json({
            users: result.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        const { duration_days, reason } = req.body;
        
        if (!req.shopAdminPermissions?.suspend_users && !req.isSuperAdmin) {
            return res.status(403).json({ error: 'Permission denied: cannot suspend users' });
        }
        
        await db.query('BEGIN');
        
        const suspensionEnd = duration_days 
            ? `NOW() + INTERVAL '${duration_days} days'`
            : 'NULL';
        
        await db.query(`
            UPDATE users 
            SET is_suspended = true, 
                suspension_end_date = ${duration_days ? `NOW() + INTERVAL '${duration_days} days'` : 'NULL'},
                suspension_reason = $1
            WHERE id = $2
        `, [reason, id]);
        
        await db.query(`
            INSERT INTO suspension_logs (user_id, admin_id, action, duration_days, reason)
            VALUES ($1, $2, 'suspend', $3, $4)
        `, [id, req.userId, duration_days, reason]);
        
        await db.query('COMMIT');
        
        res.json({ success: true });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

router.post('/users/:id/unsuspend', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.shopAdminPermissions?.suspend_users && !req.isSuperAdmin) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        await db.query('BEGIN');
        
        await db.query(`
            UPDATE users 
            SET is_suspended = false, suspension_end_date = NULL, suspension_reason = NULL
            WHERE id = $1
        `, [id]);
        
        await db.query(`
            INSERT INTO suspension_logs (user_id, admin_id, action)
            VALUES ($1, $2, 'unsuspend')
        `, [id, req.userId]);
        
        await db.query('COMMIT');
        
        res.json({ success: true });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

router.post('/users/:id/ban', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        if (!req.isSuperAdmin) {
            return res.status(403).json({ error: 'Super admin required for permanent bans' });
        }
        
        await db.query('BEGIN');
        
        // Mark user as banned (we'll use is_suspended with NULL end date as permanent)
        await db.query(`
            UPDATE users 
            SET is_suspended = true, suspension_end_date = NULL, suspension_reason = $1
            WHERE id = $2
        `, [reason, id]);
        
        await db.query(`
            INSERT INTO suspension_logs (user_id, admin_id, action, reason)
            VALUES ($1, $2, 'ban', $3)
        `, [id, req.userId, reason]);
        
        // Deactivate all their listings
        await db.query(`
            UPDATE listings SET status = 'suspended' WHERE seller_id = $1 AND status = 'active'
        `, [id]);
        
        await db.query('COMMIT');
        
        res.json({ success: true });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// FEE MANAGEMENT
// ============================================
router.get('/settings/fees', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_percent'
        `);
        
        res.json({ fee_percent: result.rows[0]?.setting_value?.value || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/fees', async (req, res) => {
    try {
        const { fee_percent } = req.body;
        
        if (!req.shopAdminPermissions?.adjust_fees && !req.isSuperAdmin) {
            return res.status(403).json({ error: 'Permission denied: cannot adjust fees' });
        }
        
        if (fee_percent < 0 || fee_percent > 20) {
            return res.status(400).json({ error: 'Fee must be between 0 and 20 percent' });
        }
        
        await db.query(`
            UPDATE platform_settings 
            SET setting_value = $1, updated_by = $2, updated_at = NOW()
            WHERE setting_key = 'platform_fee_percent'
        `, [JSON.stringify({ value: fee_percent }), req.userId]);
        
        await db.query(`
            INSERT INTO audit_logs (admin_id, action, target_type, details)
            VALUES ($1, $2, $3, $4)
        `, [req.userId, 'update_platform_fee', 'platform_settings', JSON.stringify({ fee_percent })]);
        
        res.json({ success: true, fee_percent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CREDON GO LIVE
// ============================================
router.get('/settings/credon', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT setting_value FROM platform_settings WHERE setting_key = 'credon_enabled'
        `);
        
        res.json({ credon_enabled: result.rows[0]?.setting_value?.value || false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/credon/toggle', async (req, res) => {
    try {
        if (!req.isSuperAdmin) {
            return res.status(403).json({ error: 'Super admin required for Credon Go Live' });
        }
        
        const current = await db.query(`
            SELECT setting_value FROM platform_settings WHERE setting_key = 'credon_enabled'
        `);
        
        const newValue = !(current.rows[0]?.setting_value?.value || false);
        
        await db.query(`
            UPDATE platform_settings 
            SET setting_value = $1, updated_by = $2, updated_at = NOW()
            WHERE setting_key = 'credon_enabled'
        `, [JSON.stringify({ value: newValue }), req.userId]);
        
        await db.query(`
            INSERT INTO audit_logs (admin_id, action, target_type, details)
            VALUES ($1, $2, $3, $4)
        `, [req.userId, newValue ? 'enable_credon' : 'disable_credon', 'platform_settings', '{}']);
        
        res.json({ success: true, credon_enabled: newValue });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SHOP ADMINS MANAGEMENT (Super admin only)
// ============================================
router.get('/admins', async (req, res) => {
    try {
        if (!req.isSuperAdmin) {
            return res.status(403).json({ error: 'Super admin required' });
        }
        
        const result = await db.query(`
            SELECT sa.*, u.email, u.full_name
            FROM shop_admins sa
            JOIN users u ON sa.user_id = u.id
            ORDER BY sa.created_at DESC
        `);
        
        res.json({ admins: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/admins', async (req, res) => {
    try {
        if (!req.isSuperAdmin) {
            return res.status(403).json({ error: 'Super admin required' });
        }
        
        const { email, role, permissions } = req.body;
        
        // Find user by email
        const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userResult.rows[0].id;
        
        const result = await db.query(`
            INSERT INTO shop_admins (user_id, role, permissions, created_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET role = $2, permissions = $3
            RETURNING *
        `, [userId, role, JSON.stringify(permissions), req.userId]);
        
        res.json({ success: true, admin: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/admins/:userId', async (req, res) => {
    try {
        if (!req.isSuperAdmin) {
            return res.status(403).json({ error: 'Super admin required' });
        }
        
        await db.query('DELETE FROM shop_admins WHERE user_id = $1', [req.params.userId]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
