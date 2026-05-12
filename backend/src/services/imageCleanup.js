/**
 * Image Cleanup Service
 * Deletes uploaded images when listings are removed, sold, or expired
 */
const fs = require('fs');
const path = require('path');
const db = require('../db');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/listings');

// Delete image files from disk
function deleteImageFiles(imageUrls) {
  if (!imageUrls) return;
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  urls.forEach(url => {
    if (!url || typeof url !== 'string') return;
    // Extract filename from URL like /uploads/listings/abc123.jpg
    const filename = url.split('/').pop();
    if (!filename) return;
    const filepath = path.join(UPLOAD_DIR, filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('🗑 Cleaned up image:', filename);
      }
    } catch (e) {
      console.error('Failed to delete image:', filename, e.message);
    }
  });
}

// Clean up images for a specific listing
async function cleanupListingImages(listingId) {
  try {
    const result = await db.query('SELECT images, video_url FROM listings WHERE id = $1', [listingId]);
    if (result.rows.length === 0) return;
    const listing = result.rows[0];
    if (listing.images) deleteImageFiles(listing.images);
    if (listing.video_url) deleteImageFiles([listing.video_url]);
  } catch (e) {
    console.error('Cleanup listing images error:', e.message);
  }
}

// Clean up expired listings and their images
async function cleanupExpiredListings() {
  try {
    const result = await db.query(
      `SELECT id, images, video_url FROM listings WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()`
    );
    if (result.rows.length === 0) return 0;
    
    for (const listing of result.rows) {
      deleteImageFiles(listing.images);
      if (listing.video_url) deleteImageFiles([listing.video_url]);
      await db.query(`UPDATE listings SET status = 'inactive', deleted_at = NOW(), deletion_reason = 'expired' WHERE id = $1`, [listing.id]);
    }
    console.log(`🧹 Cleaned up ${result.rows.length} expired listings`);
    return result.rows.length;
  } catch (e) {
    console.error('Cleanup expired listings error:', e.message);
    return 0;
  }
}

// Clean up orphaned images (files not referenced by any listing)
async function cleanupOrphanedImages() {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).filter(f => f !== '.gitkeep');
    const result = await db.query('SELECT images FROM listings WHERE images IS NOT NULL AND deleted_at IS NULL');
    const allRefs = new Set();
    result.rows.forEach(r => {
      const images = Array.isArray(r.images) ? r.images : [r.images];
      images.forEach(img => {
        if (img && typeof img === 'string') allRefs.add(img.split('/').pop());
      });
    });
    
    let count = 0;
    for (const file of files) {
      if (!allRefs.has(file)) {
        try {
          fs.unlinkSync(path.join(UPLOAD_DIR, file));
          count++;
        } catch(e) {}
      }
    }
    if (count > 0) console.log(`🧹 Cleaned up ${count} orphaned images`);
    return count;
  } catch (e) {
    console.error('Cleanup orphaned images error:', e.message);
    return 0;
  }
}

module.exports = { cleanupListingImages, cleanupExpiredListings, cleanupOrphanedImages, deleteImageFiles };
