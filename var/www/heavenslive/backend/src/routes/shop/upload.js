const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { verifyToken } = require('../../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../public/uploads/listings');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.chmodSync(uploadDir, 0o775);
}

// Use memory storage to process image before saving
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

// Upload and resize single image
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'listing-' + uniqueSuffix + '.jpg';
        const filepath = path.join(uploadDir, filename);
        
        // Resize image - max dimensions 1200x1200, maintain aspect ratio
        await sharp(req.file.buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);
        
        // Get actual file size after compression
        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        
        // Generate public URL
        const imageUrl = `/uploads/listings/${filename}`;
        
        console.log(`Image uploaded and resized: ${imageUrl} (${fileSizeKB} KB)`);
        
        res.json({
            success: true,
            url: imageUrl,
            filename: filename,
            size: fileSizeKB + ' KB'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
});

module.exports = router;
