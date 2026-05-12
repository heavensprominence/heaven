const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../../middleware/auth');
const { processBulkImport, generateTemplate } = require('../../services/bulkImportService');
const db = require('../../db');

// Configure multer for CSV upload
const uploadDir = '/tmp/bulk-imports';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${req.userId}-${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload and process CSV
router.post('/upload', verifyToken, upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file provided' });
        }
        
        // Get user's stores for mapping
        const stores = await db.query(
            'SELECT id, store_name FROM stores WHERE seller_id = $1',
            [req.userId]
        );
        
        const storeMap = {};
        stores.rows.forEach(s => { storeMap[s.store_name] = s.id; });
        
        // Process the CSV
        const results = await processBulkImport(req.userId, req.file.path, storeMap);
        
        res.json({
            success: true,
            results: {
                total: results.total,
                success: results.success,
                failed: results.failed,
                errors: results.errors.slice(0, 20) // Return first 20 errors
            }
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download CSV template
router.get('/template', verifyToken, (req, res) => {
    const template = generateTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk_listing_template.csv"');
    res.send(template);
});

// Validate CSV before processing
router.post('/validate', verifyToken, upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file provided' });
        }
        
        const { parse } = require('csv-parse');
        const fs = require('fs');
        
        const results = { valid: true, rowCount: 0, warnings: [] };
        const parser = fs.createReadStream(req.file.path).pipe(parse({ columns: true }));
        
        for await (const row of parser) {
            results.rowCount++;
            
            // Basic validation
            if (!row.title || row.title.length < 3) {
                results.warnings.push(`Row ${results.rowCount}: Title too short`);
            }
            if (!row.type || !['mall', 'classifieds', 'auction', 'reverse_auction'].includes(row.type.toLowerCase())) {
                results.warnings.push(`Row ${results.rowCount}: Invalid type`);
            }
            const price = parseFloat(row.price);
            if (isNaN(price) || price < 0) {
                results.warnings.push(`Row ${results.rowCount}: Invalid price`);
            }
        }
        
        // Clean up
        fs.unlinkSync(req.file.path);
        
        if (results.warnings.length > 0) {
            results.valid = false;
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
