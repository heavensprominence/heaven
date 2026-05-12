const express = require('express');
const router = express.Router();
const db = require('../../db');
const { autoTranslateCategory } = require('../../services/categoryTranslationService');

// Main categories – now includes listing count and subcategory count
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const result = await db.query(`
            SELECT sc.*, ct.name as translated_name,
                (SELECT COUNT(*) FROM listings l WHERE l.category = sc.category AND l.status = 'active') as count,
                (SELECT COUNT(*) FROM shop_categories WHERE parent_category = sc.category) as subcategory_count
            FROM shop_categories sc
            LEFT JOIN category_translations ct ON sc.category = ct.category AND ct.language_code = $1
            WHERE sc.parent_category IS NULL AND sc.is_active = true
            ORDER BY sc.sort_order, sc.display_name
        `, [lang]);
        
        const categories = result.rows.map(cat => ({
            slug: cat.category,
            name: cat.translated_name || cat.display_name,
            icon: cat.icon || '',
            count: parseInt(cat.count) || 0,
            subcategory_count: parseInt(cat.subcategory_count) || 0
        }));
        
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subcategories – also include counts
router.get('/subcategories/:parentSlug', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const result = await db.query(`
            SELECT sc.*, ct.name as translated_name,
                (SELECT COUNT(*) FROM listings l WHERE l.category = sc.category AND l.status = 'active') as count,
                (SELECT COUNT(*) FROM shop_categories WHERE parent_category = sc.category) as subcategory_count
            FROM shop_categories sc
            LEFT JOIN category_translations ct ON sc.category = ct.category AND ct.language_code = $1
            WHERE sc.parent_category = $2 AND sc.is_active = true
            ORDER BY sc.sort_order, sc.display_name
        `, [lang, req.params.parentSlug]);
        
        const subcategories = result.rows.map(cat => ({
            slug: cat.category,
            name: cat.translated_name || cat.display_name,
            icon: cat.icon || '',
            count: parseInt(cat.count) || 0,
            subcategory_count: parseInt(cat.subcategory_count) || 0
        }));
        
        res.json({ subcategories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Translate a category (manual trigger)
router.post('/translate', async (req, res) => {
    try {
        const { slug, name } = req.body;
        await autoTranslateCategory(slug, name);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Create new category (auto-translation disabled)
router.post('/admin/create', async (req, res) => {
    try {
        const { name, parent_category, icon } = req.body;
        let category = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        
        const existing = await db.query("SELECT category FROM shop_categories WHERE category LIKE $1", [category + '%']);
        if (existing.rows.length > 0) {
            const counters = existing.rows.map(r => {
                const match = r.category.match(/_(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
            category = category + '_' + (Math.max(...counters, 0) + 1);
        }
        
        await db.query(
            `INSERT INTO shop_categories (category, display_name, parent_category, icon) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (category) DO UPDATE SET display_name = $2, updated_at = NOW()`,
            [category, name, parent_category || null, icon || '📦']
        );

        // Auto-translate
        const { translateText, SUPPORTED_LANGUAGES, detectLanguage } = require('../../services/translationService');
        const srcLang = detectLanguage(name);
        for (const lang of SUPPORTED_LANGUAGES) {
            if (lang === srcLang) continue;
            try {
                const t = await translateText(name, srcLang, lang);
                if (t && t !== name) {
                    await db.query(
                        `INSERT INTO category_translations (category, language_code, name) VALUES ($1, $2, $3) ON CONFLICT (category, language_code) DO UPDATE SET name = $3`,
                        [category, lang, t]
                    );
                }
            } catch(e) {}
        }

        res.json({ success: true, category, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Category tree and flat endpoints (unchanged, but kept for admin panel)
router.get('/tree', async (req, res) => {
    const result = await db.query('SELECT * FROM shop_categories ORDER BY sort_order, display_name');
    const cats = result.rows;
    const map = {};
    const tree = [];
    cats.forEach(cat => { map[cat.category] = { ...cat, children: [] }; });
    cats.forEach(cat => {
        if (cat.parent_category && map[cat.parent_category]) {
            map[cat.parent_category].children.push(map[cat.category]);
        } else {
            tree.push(map[cat.category]);
        }
    });
    res.json({ tree });
});

router.get('/flat', async (req, res) => {
    const result = await db.query('SELECT * FROM shop_categories ORDER BY sort_order, display_name');
    res.json({ categories: result.rows });
});

router.post('/create', async (req, res) => {
    try {
        const { displayName, parentCategory, icon } = req.body;
        let category = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const existing = await db.query("SELECT category FROM shop_categories WHERE category LIKE $1", [category + '%']);
        if (existing.rows.length > 0) {
            const counters = existing.rows.map(r => {
                const match = r.category.match(/_(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
            category = category + '_' + (Math.max(...counters, 0) + 1);
        }
        const level = parentCategory ? 
            (await db.query('SELECT level FROM shop_categories WHERE category = $1', [parentCategory])).rows[0]?.level + 1 : 1;
        await db.query(
            `INSERT INTO shop_categories (category, display_name, parent_category, icon, level) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (category) DO UPDATE SET display_name = $2, updated_at = NOW()`,
            [category, displayName, parentCategory || null, icon || '📁', level || 1]
        );

        // Auto-translate category name to all supported languages
        const { translateText, SUPPORTED_LANGUAGES } = require('../../services/translationService');
        for (const lang of SUPPORTED_LANGUAGES) {
            if (lang === 'en') continue;
            try {
                const translatedName = await translateText(displayName, 'en', lang);
                if (translatedName && translatedName !== displayName) {
                    await db.query(
                        `INSERT INTO category_translations (category, language_code, name)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (category, language_code) DO UPDATE SET name = $3`,
                        [category, lang, translatedName]
                    );
                }
            } catch (e) { console.error(`Category translation ${lang} failed:`, e.message); }
        }

        res.json({ success: true, category, displayName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { displayName, icon, isActive, parentCategory } = req.body;
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (displayName !== undefined) { updates.push(`display_name = $${paramCount++}`); params.push(displayName); }
        if (icon !== undefined) { updates.push(`icon = $${paramCount++}`); params.push(icon); }
        if (isActive !== undefined) { updates.push(`is_active = $${paramCount++}`); params.push(isActive); }
        if (parentCategory !== undefined) { updates.push(`parent_category = $${paramCount++}`); params.push(parentCategory || null); }
        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
        updates.push(`updated_at = NOW()`);
        params.push(category);
        await db.query(`UPDATE shop_categories SET ${updates.join(', ')} WHERE category = $${paramCount}`, params);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:category', async (req, res) => {
    await db.query('DELETE FROM shop_categories WHERE category = $1 OR parent_category = $1', [req.params.category]);
    res.json({ success: true });
});

router.get('/translations/all', async (req, res) => {
    const result = await db.query(`
        SELECT sc.category, sc.display_name, ct.language_code, ct.name as translated_name
        FROM shop_categories sc
        LEFT JOIN category_translations ct ON sc.category = ct.category
        ORDER BY sc.display_name, ct.language_code
    `);
    res.json({ translations: result.rows });
});

// Get pending category suggestions
router.get('/suggestions/pending', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT cs.*, u.email as user_email FROM category_suggestions cs LEFT JOIN users u ON cs.user_id = u.id WHERE cs.status = 'pending' ORDER BY cs.created_at DESC"
        );
        res.json({ suggestions: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Approve suggestion
router.post('/suggestions/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, icon } = req.body;
        const sg = await db.query('SELECT * FROM category_suggestions WHERE id = ', [id]);
        if (sg.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const s = sg.rows[0];
        let cat = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        await db.query(
            'INSERT INTO shop_categories (category, display_name, parent_category, icon) VALUES ($1, $2, $3, $4) ON CONFLICT (category) DO UPDATE SET display_name = $2',
            [cat, displayName, s.parent_category || null, icon || '📁']
        );
        await db.query("UPDATE category_suggestions SET status = 'approved', reviewed_at = NOW() WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Reject suggestion
router.post('/suggestions/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;
        await db.query("UPDATE category_suggestions SET status = 'rejected', admin_notes = $1, reviewed_at = NOW() WHERE id = $2", [reason || '', req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
