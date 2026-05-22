/**
 * Admin Dashboard API Routes
 * Full management panel: users, listings, plans, disputes, metrics
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const { getMetrics } = require('../../services/logger');

// Middleware: admin only
async function adminOnly(req, res, next) {
  try {
    const user = await db.query('SELECT is_super_admin FROM users WHERE id = $1', [req.userId]);
    if (!user.rows[0]?.is_super_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

// GET /api/admin/dashboard — overview stats
router.get('/dashboard', verifyToken, adminOnly, async (req, res) => {
  try {
    const [users, listings, disputes, plans, recentUsers] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='active') as active FROM listings"),
      db.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='open') as open FROM disputes"),
      db.query('SELECT p.name, COUNT(u.id) FROM subscription_plans p LEFT JOIN users u ON u.current_plan_id = p.id GROUP BY p.id, p.name'),
      db.query('SELECT id, email, full_name, created_at, current_plan_id FROM users ORDER BY created_at DESC LIMIT 10')
    ]);
    
    res.json({
      counts: {
        users: parseInt(users.rows[0].count),
        listings: parseInt(listings.rows[0].total),
        activeListings: parseInt(listings.rows[0].active),
        disputes: parseInt(disputes.rows[0].total),
        openDisputes: parseInt(disputes.rows[0].open)
      },
      plans: plans.rows,
      recentUsers: recentUsers.rows,
      system: getMetrics()
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/users — list all users
router.get('/users', verifyToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT id, email, full_name, current_plan_id, is_super_admin, max_listings, created_at, last_login FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const params = [];
    
    if (search) {
      query += ' WHERE email ILIKE $1 OR full_name ILIKE $1';
      countQuery += ' WHERE email ILIKE $1 OR full_name ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);
    
    const [users, count] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, search ? [`%${search}%`] : [])
    ]);
    
    res.json({
      users: users.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admin/users/:id — update user plan/permissions
router.put('/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { planId, maxListings, isSuperAdmin } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;
    
    if (planId !== undefined) { updates.push(`current_plan_id = $${idx++}`); params.push(planId); }
    if (maxListings !== undefined) { updates.push(`max_listings = $${idx++}`); params.push(maxListings); }
    if (isSuperAdmin !== undefined) { updates.push(`is_super_admin = $${idx++}`); params.push(isSuperAdmin); }
    
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    params.push(req.params.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, params);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/listings — all listings with management
router.get('/listings', verifyToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    let idx = 1;
    
    if (status) { where += ` AND l.status = $${idx++}`; params.push(status); }
    if (search) { where += ` AND l.title ILIKE $${idx++}`; params.push(`%${search}%`); }
    
    const query = `SELECT l.*, u.email as seller_email FROM listings l JOIN users u ON l.seller_id = u.id WHERE ${where} ORDER BY l.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), offset);
    
    const [listings, count] = await Promise.all([
      db.query(query, params),
      db.query(`SELECT COUNT(*) FROM listings l WHERE ${where}`, params.slice(0, idx - 3))
    ]);
    
    res.json({
      listings: listings.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/listings/:id — approve/reject/toggle listing
router.put('/listings/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });
    await db.query('UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
