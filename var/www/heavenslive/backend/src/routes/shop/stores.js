const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for store images
const uploadDir = path.join(__dirname, '../../../public/uploads/stores');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `store-${req.userId}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

// Get user's store
router.get('/my-store', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, 
                   COALESCE(ss.views, 0) as views,
                   COALESCE(ss.orders, 0) as orders,
                   COALESCE(ss.revenue_cents, 0) as revenue_cents,
                   COALESCE(ss.rating, 0) as rating,
                   COALESCE(ss.review_count, 0) as review_count,
                   (SELECT COUNT(*) FROM listings WHERE store_id = s.id AND status = 'active') as active_listings
            FROM stores s
            LEFT JOIN store_stats ss ON s.id = ss.store_id
            WHERE s.seller_id = $1
        `, [req.userId]);
        res.json({ store: result.rows[0] || null });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create store
router.post('/', verifyToken, async (req, res) => {
    try {
        const { store_name, description } = req.body;
        const userId = req.userId;
        const existing = await db.query('SELECT id FROM stores WHERE seller_id = $1', [userId]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'You already have a store' });
        
        let slug = store_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let finalSlug = slug;
        let counter = 1;
        while (true) {
            const check = await db.query('SELECT 1 FROM stores WHERE slug = $1', [finalSlug]);
            if (check.rows.length === 0) break;
            finalSlug = slug + '-' + counter++;
        }
        
        const result = await db.query(`
            INSERT INTO stores (seller_id, store_name, slug, description, is_active)
            VALUES ($1, $2, $3, $4, true) RETURNING *
        `, [userId, store_name, finalSlug, description]);
        
        await db.query('INSERT INTO store_stats (store_id) VALUES ($1)', [result.rows[0].id]);
        res.status(201).json({ success: true, store: result.rows[0] });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get store by slug (public)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await db.query(`
            SELECT s.*, u.email as seller_email, u.full_name as seller_name,
                   COALESCE(ss.views, 0) as views, COALESCE(ss.orders, 0) as orders,
                   COALESCE(ss.rating, 0) as rating, COALESCE(ss.review_count, 0) as review_count
            FROM stores s
            JOIN users u ON s.seller_id = u.id
            LEFT JOIN store_stats ss ON s.id = ss.store_id
            WHERE s.slug = $1 AND s.is_active = true
        `, [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
        
        const listings = await db.query(`
            SELECT * FROM listings WHERE store_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 20
        `, [result.rows[0].id]);
        
        res.json({ store: result.rows[0], listings: listings.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Upload banner
router.post('/upload-banner', verifyToken, upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const bannerUrl = `/uploads/stores/${req.file.filename}`;
        await db.query('UPDATE stores SET banner_url = $1 WHERE seller_id = $2', [bannerUrl, req.userId]);
        res.json({ success: true, url: bannerUrl });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Upload logo
router.post('/upload-logo', verifyToken, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const logoUrl = `/uploads/stores/${req.file.filename}`;
        await db.query('UPDATE stores SET logo_url = $1 WHERE seller_id = $2', [logoUrl, req.userId]);
        res.json({ success: true, url: logoUrl });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update theme
router.put('/theme', verifyToken, async (req, res) => {
    try {
        const { theme_color, secondary_color, text_color, font_family, layout_style, show_seller_info } = req.body;
        await db.query(`
            UPDATE stores SET 
                theme_color = COALESCE($1, theme_color),
                secondary_color = COALESCE($2, secondary_color),
                text_color = COALESCE($3, text_color),
                font_family = COALESCE($4, font_family),
                layout_style = COALESCE($5, layout_style),
                show_seller_info = COALESCE($6, show_seller_info)
            WHERE seller_id = $7
        `, [theme_color, secondary_color, text_color, font_family, layout_style, show_seller_info, req.userId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Verify custom domain
router.post('/verify-domain', verifyToken, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain required' });
        
        // In production: verify DNS CNAME record
        // For now: mark as pending verification
        await db.query(
            'UPDATE stores SET custom_domain = $1, is_custom_domain_verified = false WHERE seller_id = $2',
            [domain, req.userId]
        );
        
        // TODO: Trigger DNS verification + SSL provisioning
        // dns.resolveCname(domain) should return 'stores.heavenslive.com'
        
        res.json({ success: true, verified: false, message: 'Domain saved. DNS verification pending.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
