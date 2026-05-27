const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/database');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const Dispute = require('../models/Dispute');
const Bid = require('../models/Bid');
const { sendAppointmentConfirmation } = require('../services/emailService');
const MockExchangeRates = require('../services/mockExchangeRates');
const MockMinting = require('../services/mockMinting');

// Admin middleware
const requireAdmin = async (req, res, next) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};


// Public overview — no admin required (uses token only)
router.get('/public-stats', async (req, res) => {
    try {
        const users = await pool.query('SELECT COUNT(*) as total FROM users');
        const listings = await pool.query('SELECT COUNT(*) as total FROM listings WHERE status = \'active\'');
        const disp = await pool.query('SELECT COUNT(*) as total FROM disputes');
        const credon = await pool.query('SELECT COUNT(*) as total FROM users WHERE credon_pending = true');
        const suggest = await pool.query('SELECT COUNT(*) as total FROM category_suggestions');
        res.json({
            total_users: parseInt(users.rows[0].total),
            total_listings: parseInt(listings.rows[0].total),
            total_disputes: parseInt(disp.rows[0].total),
            pending_credon: parseInt(credon.rows[0].total),
            pending_suggestions: parseInt(suggest.rows[0].total)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================
// USER MANAGEMENT
// ============================================

// GET all users
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  const { limit = 100, offset = 0, suspended } = req.query;
  
  try {
    let query = `
      SELECT id, email, full_name, whatsapp_number, is_super_admin, is_suspended, 
             suspension_end_date, created_at, last_login, email_verified
      FROM users
    `;
    const params = [];
    
    if (suspended === 'true') {
      query += ` WHERE is_suspended = true`;
    } else if (suspended === 'false') {
      query += ` WHERE is_suspended = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get wallet balances for each user
    const usersWithBalances = await Promise.all(
      result.rows.map(async (user) => {
        const balance = await Wallet.getBalance(user.id);
        return { ...user, balance_cents: balance };
      })
    );
    
    res.json({ users: usersWithBalances, total: result.rowCount });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SUSPEND user
router.post('/users/:userId/suspend', verifyToken, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { durationDays, reason } = req.body;
  
  try {
    const suspended = await User.suspend(userId, durationDays || null, reason || 'Admin action', req.userId);
    res.json({ message: 'User suspended', user: suspended });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UNSUSPEND user
router.post('/users/:userId/unsuspend', verifyToken, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const unsuspended = await User.unsuspend(userId, req.userId);
    res.json({ message: 'User unsuspended', user: unsuspended });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET user details with wallet
router.get('/users/:userId', verifyToken, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const wallet = await Wallet.getByUserId(userId);
    const transactions = await Wallet.getTransactionHistory(userId, 50);
    const orders = await Order.getUserOrders(userId);
    const appointments = await Appointment.getUserAppointments(userId);
    
    res.json({ user, wallet, transactions, orders, appointments });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// MOCK MINTING/BURNING (Admin only)
// ============================================

// MINT mock currency
router.post('/mint', verifyToken, requireAdmin, async (req, res) => {
  const { userId, amountCents, reason } = req.body;
  
  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ error: 'Valid amount_cents required' });
  }
  
  try {
    const result = await MockMinting.mint(userId, amountCents, reason, req.userId);
    res.json({
      message: 'Mock currency minted',
      ...result,
      testing_disclaimer: "THIS IS A MOCK MINT FOR TESTING ONLY"
    });
  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// BURN mock currency
router.post('/burn', verifyToken, requireAdmin, async (req, res) => {
  const { userId, amountCents, reason } = req.body;
  
  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ error: 'Valid amount_cents required' });
  }
  
  try {
    const result = await MockMinting.burn(userId, amountCents, reason, req.userId);
    res.json({
      message: 'Mock currency burned',
      ...result,
      testing_disclaimer: "THIS IS A MOCK BURN FOR TESTING ONLY"
    });
  } catch (error) {
    console.error('Burn error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET minting/burning logs
router.get('/minting-logs', verifyToken, requireAdmin, async (req, res) => {
  const { limit = 100 } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT ml.*, u.email as admin_email
       FROM minting_logs ml
       LEFT JOIN users u ON ml.admin_id = u.id
       ORDER BY ml.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get minting logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// EXCHANGE RATES (Admin)
// ============================================

// UPDATE exchange rate
router.put('/exchange-rates', verifyToken, requireAdmin, async (req, res) => {
  const { fromCurrency, toCurrency, rate } = req.body;
  
  if (!fromCurrency || !toCurrency || !rate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const updated = await MockExchangeRates.updateRate(fromCurrency, toCurrency, rate, req.userId);
    res.json({ message: 'Exchange rate updated', rate: updated });
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SYNC external rates (mock)
router.post('/exchange-rates/sync', verifyToken, requireAdmin, async (req, res) => {
  try {
    await MockExchangeRates.syncExternalRates(req.userId);
    res.json({ message: 'Exchange rates synced from external provider (MOCK)' });
  } catch (error) {
    console.error('Sync rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ORDER MANAGEMENT (Admin)
// ============================================

// GET all orders
router.get('/orders', verifyToken, requireAdmin, async (req, res) => {
  const { limit = 100, offset = 0, status } = req.query;
  
  try {
    const orders = await Order.getAllOrders(parseInt(limit), parseInt(offset), status);
    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE shipping info
router.put('/orders/:orderId/shipping', verifyToken, requireAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, carrier } = req.body;
  
  try {
    const updated = await Order.updateShipping(orderId, trackingNumber, carrier);
    res.json({ message: 'Shipping info updated', order: updated });
  } catch (error) {
    console.error('Update shipping error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// APPOINTMENT MANAGEMENT (Admin)
// ============================================

// GET upcoming appointments
router.get('/appointments/upcoming', verifyToken, requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.getUpcomingAppointments();
    res.json({ appointments });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CONFIRM appointment (ready for WhatsApp)
router.post('/appointments/:appointmentId/confirm', verifyToken, requireAdmin, async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const confirmed = await Appointment.confirmAppointment(appointmentId, req.userId);
    res.json({ message: 'Appointment confirmed', appointment: confirmed });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MARK WhatsApp contact added
router.post('/appointments/:appointmentId/whatsapp-added', verifyToken, requireAdmin, async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const updated = await Appointment.markWhatsAppAdded(appointmentId);
    res.json({ message: 'WhatsApp contact marked as added', appointment: updated });
  } catch (error) {
    console.error('Mark WhatsApp error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// COMPLETE appointment
router.post('/appointments/:appointmentId/complete', verifyToken, requireAdmin, async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const completed = await Appointment.completeAppointment(appointmentId, req.userId);
    res.json({ message: 'Appointment completed', appointment: completed });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CANCEL appointment (admin)
router.delete('/appointments/:appointmentId', verifyToken, requireAdmin, async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const cancelled = await Appointment.cancelByAdmin(appointmentId, req.userId);
    res.json({ message: 'Appointment cancelled', appointment: cancelled });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DISPUTE MANAGEMENT (Admin)
// ============================================

// GET all disputes
router.get('/disputes', verifyToken, requireAdmin, async (req, res) => {
  const { limit = 100, offset = 0, status } = req.query;
  
  try {
    const disputes = await Dispute.getAllDisputes(parseInt(limit), parseInt(offset), status);
    res.json({ disputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE dispute status
router.put('/disputes/:disputeId', verifyToken, requireAdmin, async (req, res) => {
  const { disputeId } = req.params;
  const { status, resolutionNotes } = req.body;
  
  try {
    const updated = await Dispute.updateStatus(disputeId, status, resolutionNotes, req.userId);
    res.json({ message: 'Dispute updated', dispute: updated });
  } catch (error) {
    console.error('Update dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// REVERSE transaction (admin only - for fraud/mistake)
router.post('/transactions/:transactionId/reverse', verifyToken, requireAdmin, async (req, res) => {
  const { transactionId } = req.params;
  const { reason } = req.body;
  
  try {
    // Get original transaction
    const transactionResult = await pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [transactionId]
    );
    
    if (!transactionResult.rows[0]) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const originalTx = transactionResult.rows[0];
    
    // Reverse the amount
    const reverseAmount = -originalTx.amount_cents;
    
    const reversed = await Wallet.updateBalance(
      originalTx.user_id,
      reverseAmount,
      'refund',
      `Reversal of transaction ${transactionId}: ${reason}`,
      transactionId
    );
    
    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, 'REVERSE_TRANSACTION', 'transaction', transactionId, JSON.stringify({ reason })]
    );
    
    res.json({
      message: 'Transaction reversed',
      reversal: reversed,
      testing_disclaimer: "THIS IS A TESTING REVERSAL"
    });
  } catch (error) {
    console.error('Reverse transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BID MANAGEMENT (Admin)
// ============================================

// GET all open bids
router.get('/bids', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.email
       FROM bids b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'open'
       ORDER BY b.created_at DESC`
    );
    res.json({ bids: result.rows });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN cancel any bid
router.delete('/bids/:bidId', verifyToken, requireAdmin, async (req, res) => {
  const { bidId } = req.params;
  
  try {
    const cancelled = await Bid.adminCancelBid(bidId, req.userId);
    if (!cancelled) {
      return res.status(404).json({ error: 'Bid not found or already closed' });
    }
    res.json({ message: 'Bid cancelled', bid: cancelled });
  } catch (error) {
    console.error('Admin cancel bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// STATISTICS DASHBOARD (Admin)
// ============================================

router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM wallets WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM carts WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM listings WHERE seller_id = $1', [req.params.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    // User stats
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_suspended THEN 1 ELSE 0 END) as suspended_users,
        SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified_users,
        COUNT(DISTINCT u.id) as users_with_wallet
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
    `);
    
    // Order stats
    const orderStats = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount_usd) as total_usd
      FROM orders
      GROUP BY type
    `);
    
    // Transaction stats
    const txStats = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount_cents) as total_cents
      FROM transactions
      GROUP BY type
    `);
    
    // Appointment stats
    const appointmentStats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      GROUP BY status
    `);
    
    // Total mock currency in circulation
    const totalSupply = await pool.query(`
      SELECT SUM(balance_cents) as total_cents
      FROM wallets
    `);
    
    res.json({
      users: userStats.rows[0],
      orders: orderStats.rows,
      transactions: txStats.rows,
      appointments: appointmentStats.rows,
      total_supply_cents: totalSupply.rows[0].total_cents || 0,
      testing_disclaimer: "ALL STATISTICS ARE FOR TESTING ONLY"
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats — Dashboard overview
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM wallets WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM carts WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM listings WHERE seller_id = $1', [req.params.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        const listings = await pool.query("SELECT COUNT(*) as count FROM listings WHERE status = 'active'");
        const treasury = await pool.query('SELECT COALESCE(SUM(CASE WHEN action=\'mint\' THEN amount_cents ELSE -amount_cents END),0) as balance FROM treasury_ledger');
        res.json({
            users: parseInt(users.rows[0].count),
            listings: parseInt(listings.rows[0].count),
            treasury: parseInt(treasury.rows[0].balance) / 100,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats for admin dashboard
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM wallets WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM carts WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM listings WHERE seller_id = $1', [req.params.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) as count FROM users");
    const listings = await pool.query("SELECT COUNT(*) as count FROM listings WHERE status = 'active'");
    const treasury = await pool.query("SELECT COALESCE(SUM(CASE WHEN action = 'mint' THEN amount_cents ELSE -amount_cents END), 0) as balance FROM treasury_ledger");
    res.json({
      users: parseInt(users.rows[0].count),
      listings: parseInt(listings.rows[0].count),
      treasury: parseInt(treasury.rows[0].balance) / 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// === SYSTEM SETTINGS (Admin) ===
const SystemSettings = require('../services/systemSettings');

router.get('/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const settings = await SystemSettings.getAll();
        res.json({ settings });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Setting key required' });
        await SystemSettings.set(key, value);
        const settings = await SystemSettings.getAll();
        res.json({ success: true, settings });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// === DISPUTE MANAGEMENT ===
router.get('/disputes', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, u1.email as buyer_email, u2.email as seller_email
            FROM disputes d
            LEFT JOIN users u1 ON d.filed_by = u1.id
            LEFT JOIN users u2 ON d.against_user = u2.id
            ORDER BY d.created_at DESC LIMIT 50
        `);
        res.json({ disputes: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/disputes/:id/resolve', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { resolution, status } = req.body;
        await pool.query(
            'UPDATE disputes SET status = $1, resolution = $2, resolved_at = NOW(), resolved_by = $3 WHERE id = $4',
            [status || 'resolved', resolution, req.userId, req.params.id]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// === USER MANAGEMENT ===
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, is_super_admin, is_suspended, suspension_reason, suspension_end_date, created_at, email_verified FROM users ORDER BY created_at DESC LIMIT 100'
        );
        res.json({ users: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/users/:id/suspend', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { reason, duration_days } = req.body;
        const endDate = duration_days ? new Date(Date.now() + duration_days * 86400000) : null;
        await pool.query(
            'UPDATE users SET is_suspended = true, suspension_reason = $1, suspension_end_date = $2 WHERE id = $3',
            [reason || 'Admin action', endDate, req.params.id]
        );
        await pool.query(
            'INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.userId, 'suspend_user', 'user', req.params.id, JSON.stringify({ reason, duration_days })]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/users/:id/unsuspend', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_suspended = false, suspension_reason = NULL, suspension_end_date = NULL WHERE id = $1', [req.params.id]);
        await pool.query('INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES ($1, $2, $3, $4)', [req.userId, 'unsuspend_user', 'user', req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// === TREASURY MINTING & BURNING ===
router.get('/treasury', verifyToken, requireAdmin, async (req, res) => {
    try {
        const MockMinting = require('../services/mockMinting');
        const summary = await MockMinting.getTreasurySummary();
        const ledger = await pool.query('SELECT * FROM treasury_ledger ORDER BY created_at DESC LIMIT 50');
        res.json({ summary, ledger: ledger.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/treasury/mint', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { amount_cents, reason } = req.body;
        if (!amount_cents || amount_cents <= 0) return res.status(400).json({ error: 'Positive amount required' });
        const MockMinting = require('../services/mockMinting');
        const result = await MockMinting.mintToTreasury(amount_cents, reason || 'Admin mint', req.userId);
        await pool.query('INSERT INTO audit_logs (admin_id, action, target_type, details) VALUES ($1, $2, $3, $4)', [req.userId, 'mint_treasury', 'treasury', JSON.stringify({ amount_cents, reason })]);
        res.json({ success: true, ...result });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/treasury/burn', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { amount_cents, reason } = req.body;
        if (!amount_cents || amount_cents <= 0) return res.status(400).json({ error: 'Positive amount required' });
        const MockMinting = require('../services/mockMinting');
        // Burn from treasury: record negative mint (destroy currency)
        await pool.query('INSERT INTO treasury_ledger (amount_cents, reason, action, admin_id, title) VALUES ($1, $2, $3, $4, $5)', [amount_cents, reason || 'Admin burn', 'burn', req.userId, 'Burned Digital Currency']);
        await pool.query('INSERT INTO audit_logs (admin_id, action, target_type, details) VALUES ($1, $2, $3, $4)', [req.userId, 'burn_treasury', 'treasury', JSON.stringify({ amount_cents, reason })]);
        const balance = await pool.query('SELECT COALESCE(SUM(CASE WHEN action = \'mint\' THEN amount_cents WHEN action = \'burn\' THEN -amount_cents WHEN action = \'distribute\' THEN -amount_cents WHEN action = \'burn_return\' THEN amount_cents ELSE 0 END), 0) as balance FROM treasury_ledger');
        res.json({ success: true, new_balance_cents: parseInt(balance.rows[0].balance) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/treasury/distribute', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { user_email, amount_cents, reason } = req.body;
        if (!user_email || !amount_cents || amount_cents <= 0) return res.status(400).json({ error: 'User email and positive amount required' });
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [user_email]);
        if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const MockMinting = require('../services/mockMinting');
        const result = await MockMinting.distributeFromTreasury(user.rows[0].id, amount_cents, reason || 'Admin distribution');
        await pool.query('INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)', [req.userId, 'distribute_treasury', 'user', user.rows[0].id, JSON.stringify({ amount_cents, reason })]);
        res.json({ success: true, ...result });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// === ADMIN AVAILABILITY ===
router.get('/availability', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM admin_availability WHERE admin_id = $1 ORDER BY day_of_week, start_time',
            [req.userId]
        );
        res.json({ availability: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/availability', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { day_of_week, start_time, end_time } = req.body;
        if (day_of_week === undefined || !start_time || !end_time) {
            return res.status(400).json({ error: 'day_of_week, start_time, and end_time required' });
        }
        await pool.query(
            'INSERT INTO admin_availability (admin_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
            [req.userId, day_of_week, start_time, end_time]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/availability/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM admin_availability WHERE id = $1 AND admin_id = $2', [req.params.id, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// === LOAN & GRANT APPROVAL ===
router.get('/loans', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT lr.*, u.email, u.full_name FROM loan_requests lr
             JOIN users u ON lr.user_id = u.id ORDER BY lr.created_at DESC LIMIT 50`
        );
        res.json({ loans: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/loans/:id/approve', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { amount_cents, currency, interest_rate } = req.body;
        if (!amount_cents || amount_cents <= 0) return res.status(400).json({ error: 'Amount required' });
        if (interest_rate === undefined) return res.status(400).json({ error: 'Interest rate required (-100 = grant, 0 = interest-free, 1-5 = low interest)' });
        
        // Get the loan request
        const loan = await pool.query('SELECT * FROM loan_requests WHERE id = $1', [req.params.id]);
        if (loan.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        
        const lr = loan.rows[0];
        const rate = parseFloat(interest_rate);
        const isGrant = rate === -100;
        
        // Mint funds if needed (check treasury)
        const MockMinting = require('../services/mockMinting');
        const treasuryBefore = await MockMinting.getTreasuryBalance();
        if (treasuryBefore < amount_cents) {
            // Auto-mint the difference
            await MockMinting.mintToTreasury(amount_cents - treasuryBefore, 'Auto-mint for loan/grant approval', req.userId);
        }
        
        // Distribute to user
        await MockMinting.distributeFromTreasury(
            lr.user_id, amount_cents,
            `${isGrant ? 'Grant' : 'Loan'} approved: ${rate}% interest, ${currency || 'Credon-USD'}`
        );
        
        // Update loan request
        await pool.query(
            'UPDATE loan_requests SET status = $1, amount_requested = $2, currency = $3, interest_rate = $4, approved_by = $5, approved_at = NOW(), admin_notes = $6 WHERE id = $7',
            ['approved', amount_cents, currency || 'Credon-USD', rate, req.userId,
             `${isGrant ? 'GRANT' : 'LOAN'} — ${rate}% interest`,
             req.params.id]
        );
        
        // Create active loan record for tracking
        if (!isGrant) {
            await pool.query(
                'INSERT INTO active_loans (user_id, loan_request_id, principal_cents, remaining_cents, interest_rate, currency) VALUES ($1, $2, $3, $4, $5, $6)',
                [lr.user_id, req.params.id, amount_cents, amount_cents, rate, currency || 'Credon-USD']
            );
        }
        
        await pool.query('INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
            [req.userId, isGrant ? 'approve_grant' : 'approve_loan', 'loan_request', req.params.id,
             JSON.stringify({ amount_cents, currency, interest_rate: rate, user_id: lr.user_id })]);
        
        res.json({ 
            success: true, 
            type: isGrant ? 'grant' : 'loan',
            amount: amount_cents / 100, 
            currency: currency || 'Credon-USD',
            interest_rate: rate 
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/loans/:id/reject', verifyToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE loan_requests SET status = $1 WHERE id = $2', ['rejected', req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// === CURRENCY SERIAL REGISTRATION ===
const SerialRegistry = require('../services/serialRegistry');

router.post('/currency/register-batch', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { currency, denomination_cents, denomination_value, count, batch_id } = req.body;
        if (!currency || !denomination_cents || !count) {
            return res.status(400).json({ error: 'currency, denomination_cents, and count required' });
        }
        const result = await SerialRegistry.registerBatch(currency, denomination_cents, denomination_value, count, batch_id || `BATCH-${Date.now()}`);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/currency/mark-printed', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { serials, printer_id } = req.body;
        if (!serials || !serials.length) return res.status(400).json({ error: 'serials array required' });
        const result = await SerialRegistry.markPrinted(serials, printer_id || 'manual');
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// === Credon Registration Approvals ===

// Get pending Credon registrations
router.get('/credon/pending', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, email, full_name, join_reason, referral_code, created_at FROM users WHERE credon_pending = true AND credon_approved = false ORDER BY created_at DESC"
        );
        res.json({ pending: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve Credon registration
router.post('/credon/approve', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        await pool.query(
            "UPDATE users SET credon_approved = true, credon_pending = false WHERE id = $1",
            [userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject Credon registration
router.post('/credon/reject', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        await pool.query(
            "UPDATE users SET credon_approved = false, credon_pending = false WHERE id = $1",
            [userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get/update affiliate commission settings
router.get('/affiliate/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query("SELECT setting_value FROM affiliate_settings WHERE setting_key = 'commission_structure'");
        res.json({ settings: result.rows[0]?.setting_value || {} });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/affiliate/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { signup_bonus, first_purchase_rate, ongoing_purchase_rate, seller_sale_rate, minimum_payout_cents } = req.body;
        const settings = { signup_bonus, first_purchase_rate, ongoing_purchase_rate, seller_sale_rate, minimum_payout_cents };
        await pool.query(
            "INSERT INTO affiliate_settings (setting_key, setting_value) VALUES ('commission_structure', $1) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1",
            [JSON.stringify(settings)]
        );
        res.json({ success: true, settings });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Book appointment
router.post('/', verifyToken, async (req, res) => {
    try {
        const { appointment_time, duration_minutes, reason } = req.body;
        const result = await pool.query(
            'INSERT INTO appointments (user_id, appointment_time, duration_minutes, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.userId, appointment_time, duration_minutes || 15, reason || 'General', 'scheduled']
        );
        const appointment = result.rows[0];
        
        // Send confirmation email to user + admin
        try {
            const user = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [req.userId]);
            if (user.rows[0]?.email) {
                await sendAppointmentConfirmation(user.rows[0].email, appointment);
            }
        } catch (emailErr) {
            console.error('Appointment email failed:', emailErr.message);
            // Don't fail the booking if email fails
        }
        
        res.json({ success: true, appointment });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get my appointments
router.get('/my-appointments', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_time DESC LIMIT 20',
            [req.userId]
        );
        res.json({ appointments: result.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
