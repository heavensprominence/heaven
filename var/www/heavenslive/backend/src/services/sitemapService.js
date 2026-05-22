const db = require('../db');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../../../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

async function regenerateSitemap() {
  try {
    const listings = await db.query("SELECT id, updated_at FROM listings WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500");
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <url><loc>https://heavenslive.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/shop/</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/shop/download</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/credon/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/shop/pricing</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n';
    for (const l of listings.rows) {
      const d = new Date(l.updated_at).toISOString().split('T')[0];
      xml += '  <url><loc>https://heavenslive.com/shop/listing/' + l.id + '</loc><lastmod>' + d + '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n';
    }
    xml += '</urlset>';
    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log('🗺️ Sitemap regenerated —', listings.rows.length, 'listings');
  } catch(e) {
    console.error('Sitemap regen error:', e.message);
  }
}

module.exports = { regenerateSitemap };
