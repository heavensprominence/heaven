/**
 * Image health — detect listings whose image files are missing on disk.
 * Used to surface silent breakage (404 images) instead of letting it go unnoticed.
 */
const fs = require('fs');
const path = require('path');

// Uploads are served from public/uploads (see nginx + express.static(PUBLIC_DIR)).
const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

function resolveImagePath(url) {
  if (typeof url !== 'string' || !url) return null;
  const rel = url.replace(/^\/?uploads\//, '');
  if (!rel || rel === url) return null; // external URL — can't check locally
  return path.join(UPLOADS_DIR, rel);
}

function missingImagesForListing(listing) {
  const missing = [];
  for (const img of (listing.images || [])) {
    const p = resolveImagePath(img);
    if (p && !fs.existsSync(p)) missing.push(img);
  }
  return missing;
}

async function findListingsWithMissingImages(db, sellerId) {
  const where = sellerId ? 'seller_id = $1 AND status = $2' : 'status = $1';
  const params = sellerId ? [sellerId, 'active'] : ['active'];
  const result = await db.query(
    `SELECT id, title, images, seller_id FROM listings WHERE ${where} ORDER BY created_at DESC`,
    params
  );
  const out = [];
  for (const l of result.rows) {
    const missing = missingImagesForListing(l);
    if (missing.length) {
      out.push({ id: l.id, title: l.title, seller_id: l.seller_id, missing_images: missing });
    }
  }
  return out;
}

module.exports = { UPLOADS_DIR, resolveImagePath, missingImagesForListing, findListingsWithMissingImages };
