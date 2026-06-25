const db = require('../db');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../../../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

async function regenerateSitemap() {
  try {
    const listings = await db.query("SELECT id, updated_at FROM listings WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500");
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const STATIC_URLS = [
      {loc:"https://heavenslive.com/",changefreq:"daily",priority:"1.0"},
      {loc:"https://heavenslive.com/shop/",changefreq:"hourly",priority:"0.9"},
      {loc:"https://heavenslive.com/credon/",changefreq:"weekly",priority:"0.8"},
      {loc:"https://heavenslive.com/credon/wallet",changefreq:"weekly",priority:"0.8"},
      {loc:"https://heavenslive.com/credon/ledger",changefreq:"weekly",priority:"0.8"},
      {loc:"https://heavenslive.com/shop/register",changefreq:"weekly",priority:"0.8"},
      {loc:"https://heavenslive.com/shop/create",changefreq:"weekly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop/download",changefreq:"weekly",priority:"0.8"},
      {loc:"https://heavenslive.com/shop/pricing",changefreq:"monthly",priority:"0.6"},
      {loc:"https://heavenslive.com/shop/seller/dashboard",changefreq:"weekly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop/buyer/dashboard",changefreq:"weekly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop/affiliate",changefreq:"weekly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop/gift-cards",changefreq:"weekly",priority:"0.6"},
      {loc:"https://heavenslive.com/shop/wanted",changefreq:"weekly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop/promotions",changefreq:"weekly",priority:"0.6"},
      {loc:"https://heavenslive.com/shop/settings",changefreq:"monthly",priority:"0.4"},
      {loc:"https://heavenslive.com/shop/profile",changefreq:"monthly",priority:"0.5"},
      {loc:"https://heavenslive.com/shop/terms",changefreq:"monthly",priority:"0.3"},
      {loc:"https://heavenslive.com/shop/privacy",changefreq:"monthly",priority:"0.3"},
      {loc:"https://heavenslive.com/shop/api-reference",changefreq:"monthly",priority:"0.6"},
      {loc:"https://heavenslive.com/currency-catalog.html",changefreq:"monthly",priority:"0.5"},
      {loc:"https://heavenslive.com/credon/faq.html",changefreq:"monthly",priority:"0.7"},
      {loc:"https://heavenslive.com/shop.md",changefreq:"monthly",priority:"0.4"},
      {loc:"https://heavenslive.com/credon.md",changefreq:"monthly",priority:"0.4"},
      {loc:"https://heavenslive.com/llms.txt",changefreq:"monthly",priority:"0.4"},
    ];
    for (const u of STATIC_URLS) {
      xml += '  <url><loc>' + u.loc + '</loc><changefreq>' + u.changefreq + '</changefreq><priority>' + u.priority + '</priority></url>\n';
    }
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
