const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/ledger/summary — public stats
router.get('/summary', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                action,
                COUNT(*)::int as count,
                SUM(amount_cents)::bigint as total_cents
            FROM treasury_ledger
            WHERE created_at >= NOW() - INTERVAL '3 years'
            GROUP BY action
            ORDER BY action
        `);
        const net = stats.rows.reduce((sum, r) => sum + parseInt(r.total_cents), 0);
        res.json({
            netCirculationCents: net,
            byAction: stats.rows.map(r => ({
                action: r.action,
                count: r.count,
                totalCents: parseInt(r.total_cents)
            }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/ledger/entries — public paginated ledger, last 3 years
router.get('/entries', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const offset = (page - 1) * limit;
        const action = req.query.action || null;
        const dateFrom = req.query.dateFrom || null;
        const dateTo = req.query.dateTo || null;

        let where = "WHERE created_at >= NOW() - INTERVAL '3 years'";
        const params = [];
        let paramIdx = 1;

        if (action) {
            where += ` AND action = $${paramIdx++}`;
            params.push(action);
        }
        if (dateFrom) {
            where += ` AND created_at >= $${paramIdx++}`;
            params.push(dateFrom);
        }
        if (dateTo) {
            where += ` AND created_at <= $${paramIdx++}::date + INTERVAL '1 day'`;
            params.push(dateTo);
        }

        // Total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*)::int as total FROM treasury_ledger ${where}`,
            params
        );
        const total = countResult.rows[0].total;

        // Entries
        const entries = await pool.query(
            `SELECT
                id, action, amount_cents, reason, title, created_at,
                admin_id, reference_id
            FROM treasury_ledger ${where}
            ORDER BY created_at DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limit, offset]
        );

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            entries: entries.rows.map(e => ({
                id: e.id,
                action: e.action,
                amountCents: parseInt(e.amount_cents),
                title: e.title || '',
                reason: e.reason || '',
                createdAt: e.created_at,
                adminId: e.admin_id,
                referenceId: e.reference_id
            }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/ledger/actions — list of available action types for filter dropdown
router.get('/actions', async (req, res) => {
    try {
        const actions = await pool.query(
            "SELECT DISTINCT action FROM treasury_ledger WHERE created_at >= NOW() - INTERVAL '3 years' ORDER BY action"
        );
        res.json(actions.rows.map(r => r.action));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
