const db = require('../db');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shop.heavenslive.com';

async function generateSitemap() {
    try {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
        xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
        
        // Homepage
        xml += `  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
        
        // Active listings
        const listings = await db.query(`
            SELECT id, title, images, updated_at FROM listings 
            WHERE status = 'active' ORDER BY created_at DESC LIMIT 5000
        `);
        
        for (const l of listings.rows) {
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/listing/${l.id}</loc>\n`;
            xml += `    <lastmod>${new Date(l.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            
            if (l.images && l.images.length > 0) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${l.images[0].startsWith('http') ? l.images[0] : 'https://heavenslive.com' + l.images[0]}</image:loc>\n`;
                xml += `      <image:title>${escapeXml(l.title)}</image:title>\n`;
                xml += `    </image:image>\n`;
            }
            
            xml += `  </url>\n`;
        }
        
        // Stores
        const stores = await db.query(`
            SELECT slug, store_name, updated_at FROM stores WHERE is_active = true
        `);
        
        for (const s of stores.rows) {
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/store/${s.slug}</loc>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        }
        
        // Static pages
        const staticPages = ['/help', '/contact'];
        for (const page of staticPages) {
            xml += `  <url><loc>${BASE_URL}${page}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
        }
        
        xml += '</urlset>';
        
        const outputPath = path.join(__dirname, '../../../public/sitemap.xml');
        fs.writeFileSync(outputPath, xml);
        console.log(`✅ Sitemap generated with ${listings.rows.length} listings and ${stores.rows.length} stores`);
        
    } catch (error) {
        console.error('Sitemap error:', error);
    } finally {
        process.exit(0);
    }
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}

generateSitemap();
