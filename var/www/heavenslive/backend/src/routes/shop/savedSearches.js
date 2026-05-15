const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json({ searches: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, searchType, category, type, minPrice, maxPrice, keywords, notificationFrequency } = req.body;
        const filters = { category, type, minPrice, maxPrice, keywords };
        const result = await db.query(`
            INSERT INTO saved_searches (user_id, name, search_type, filters, notification_frequency)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [req.userId, name, searchType, JSON.stringify(filters), notificationFrequency]);
        res.status(201).json({ success: true, search: result.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { is_active } = req.body;
        await db.query('UPDATE saved_searches SET is_active = $1 WHERE id = $2 AND user_id = $3', [is_active, req.params.id, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.query('DELETE FROM saved_searches WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
