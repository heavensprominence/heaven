const express = require('express');
const router = express.Router();
const db = require('../../db');
const { autoTranslateListing, translateText } = require('../../services/translationService');

// Get translations for a listing
router.get('/listing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lang } = req.query;
        
        let query = 'SELECT * FROM listing_translations WHERE listing_id = $1';
        const params = [id];
        
        if (lang) {
            query += ' AND language_code = $2';
            params.push(lang);
        }
        
        const result = await db.query(query, params);
        res.json({ translations: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update translation (manual override)
router.post('/listing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { language_code, title, description } = req.body;
        
        const result = await db.query(
            `INSERT INTO listing_translations (listing_id, language_code, title, description, translated_by)
             VALUES ($1, $2, $3, $4, 'manual')
             ON CONFLICT (listing_id, language_code) 
             DO UPDATE SET title = $3, description = $4, translated_by = 'manual', updated_at = NOW()
             RETURNING *`,
            [id, language_code, title, description]
        );
        
        res.json({ translation: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Auto-translate a listing
router.post('/listing/:id/auto-translate', async (req, res) => {
    try {
        const { id } = req.params;
        await autoTranslateListing(id);
        
        const result = await db.query(
            'SELECT * FROM listing_translations WHERE listing_id = $1 ORDER BY language_code',
            [id]
        );
        
        res.json({ success: true, translations: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
