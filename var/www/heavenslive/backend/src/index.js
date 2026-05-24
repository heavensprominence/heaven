require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const shopRatingsRoutes = require("./routes/shop/ratings");
const shopDisputesRoutes = require("./routes/shop/disputes");
const shopAnalyticsRoutes = require("./routes/shop/analytics");
const shopBulkImportRoutes = require("./routes/shop/bulkImport");
const shopPromotionsRoutes = require("./routes/shop/promotions");
const shopSavedSearchesRoutes = require("./routes/shop/savedSearches");
const shopGiftCardsRoutes = require("./routes/shop/giftCards");
const shopAffiliateRoutes = require("./routes/shop/affiliate");
const shopAdminAffiliateRoutes = require("./routes/shop/adminAffiliate");
const shopSubscriptionsRoutes = require("./routes/shop/subscriptions");
const shopAdminSubscriptionsRoutes = require("./routes/shop/adminSubscriptions");
const shopAdvancedAnalyticsRoutes = require("./routes/shop/advancedAnalytics");
const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = 5000;

const PUBLIC_DIR = path.join(__dirname, "../../public");

const mime = require('mime-types') || { lookup: (f) => f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream' };

// Express 5 sendFile replacement — bypasses broken send module on Windows
const sendFile = (res, filePath) => {
  try {
    const data = require('fs').readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' };
    res.type(types[ext] || 'application/octet-stream');
    return res.send(data);
  } catch (e) {
    return res.status(404).send('Not Found');
  }
};
const BUILD_DIR = path.join(__dirname, "../../frontend/build");
const SHOP_BUILD_DIR = path.join(__dirname, "../../frontend-shop/build");
const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");

// Structured logging + metrics
const { accessLogger, getMetrics } = require("./services/logger");
app.use(accessLogger);

// Ensure uploads directory exists
require('fs').mkdirSync(path.join(UPLOADS_DIR, 'listings'), { recursive: true });

// Import routes
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const mockPurchaseRoutes = require("./routes/mockPurchase");
const walletRoutes = require("./routes/wallet");
const adminRoutes = require("./routes/admin");
const appointmentsRoutes = require("./routes/appointments");
const bidsRoutes = require("./routes/bids");
const disputesRoutes = require("./routes/disputes");
const shopAdminRoutes = require("./routes/shop/adminShop");
const shopCategoryRoutes = require("./routes/shop/categories");
const shopListingsRoutes = require("./routes/shop/listings");
const shopCartRoutes = require("./routes/shop/cart");
const shopWishlistRoutes = require("./routes/shop/wishlist");
const shopRoutes = require("./routes/shop");
const shopSupportRoutes = require("./routes/shop/support");
const shopMessagesRoutes = require("./routes/shop/messages");
const syncRoutes = require("./routes/sync");
const shopUploadRoutes = require("./routes/shop/upload");
const shopStoreRoutes = require("./routes/shop/stores");
const shopEscrowRoutes = require("./routes/shop/escrow");
const shopShippingRoutes = require("./routes/shop/shipping");
const landingRoutes = require("./routes/landing");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/mock-purchase", mockPurchaseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/bids", bidsRoutes);
app.use("/api/disputes", disputesRoutes);
app.use("/api/shop/admin", shopAdminRoutes);
app.use("/api/admin", require("./routes/shop/adminDashboard"));
app.use("/api/ai", require("./routes/shop/aiAssistant"));
app.use("/api/ai/support", require("./routes/shop/aiSupport"));
app.use("/api/ai", require("./routes/shop/aiImport"));
app.use("/api/shop/categories", shopCategoryRoutes);
app.use("/api/shop/listings", shopListingsRoutes);
app.use("/api/shop/cart", shopCartRoutes);
app.use("/api/shop/wishlist", shopWishlistRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/shop/support", shopSupportRoutes);
app.use("/api/shop/messages", shopMessagesRoutes);
app.use("/api/shop/ratings", shopRatingsRoutes);
app.use("/api/shop/disputes", shopDisputesRoutes);
app.use("/api/shop/analytics", shopAnalyticsRoutes);
app.use("/api/shop/bulk", shopBulkImportRoutes);
app.use("/api/shop/promotions", shopPromotionsRoutes);
app.use("/api/shop/saved-searches", shopSavedSearchesRoutes);
app.use("/api/shop/gift-cards", shopGiftCardsRoutes);
app.use("/api/shop/affiliate", shopAffiliateRoutes);
app.use("/api/affiliate", require("./routes/shop/affiliateEngine"));
app.use("/api/shop/promos", require("./routes/shop/promos"));
app.use("/api/shop/admin/affiliate", shopAdminAffiliateRoutes);
app.use("/api/shop/subscriptions", shopSubscriptionsRoutes);
app.use("/api/shop/admin/subscriptions", shopAdminSubscriptionsRoutes);
app.use("/api/shop/advanced-analytics", shopAdvancedAnalyticsRoutes);
app.use("/api/shop/upload", shopUploadRoutes);
app.use("/api/shop/stores", shopStoreRoutes);
app.use("/api/shop/escrow", shopEscrowRoutes);
app.use("/api/shop/shipping", shopShippingRoutes);
app.use("/api/shop/translations", require("./routes/shop/translations"));

// Public store page
app.get("/shop/store/:slug", (req, res, next) => {
  // Don't catch settings/customization pages
  if (req.params.slug === 'settings' || req.params.slug === 'customization') return next();
  const storeFile = path.join(SHOP_BUILD_DIR, "store.html");
  if (require("fs").existsSync(storeFile)) return sendFile(res, storeFile);
  sendFile(res, path.join(SHOP_BUILD_DIR, "index.html"));
});

app.get("/api-docs", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "api-docs.html")));
app.get("/shop/checkout", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "checkout.html")));
app.get("/shop/bug-report", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "bug-report.html")));
app.get("/shop/reset-password", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "reset-password.html")));
app.get("/shop/listing/:id", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "listing/detail.html")));

// Landing page (public — donations, USB purchases)
app.use("/api/landing", landingRoutes);

// Currency verification (public — no auth)
app.use("/api/verify", require("./routes/verify"));

// Payments (PayPal redirect flow)
app.use("/api/payment", require("./routes/payment"));
app.use("/payment", require("./routes/payment"));

// PowerSync — device upload + conflict resolution (last-write-wins)
app.use("/api/sync", syncRoutes);

// Static files
app.get("/", (req, res) => sendFile(res, path.join(PUBLIC_DIR, "index.html")));

app.use('/currency-svgs', express.static('/home/bryan/.openclaw/canvas/currency'));
app.use(express.static(PUBLIC_DIR));
app.use("/credon", express.static(BUILD_DIR));
app.use("/static", express.static(path.join(BUILD_DIR, "static")));

// Credon SPA
app.get("/credon", (req, res) => sendFile(res, path.join(BUILD_DIR, "index.html")));
app.get("/credon", (req, res) => sendFile(res, path.join(PUBLIC_DIR, "credon/index.html")));
app.get("/credon/admin", (req, res) => { res.set("Cache-Control","no-store,no-cache,must-revalidate"); sendFile(res, path.join(PUBLIC_DIR, "credon/admin.html")); });
app.get("/credon/admin", (req, res) => { res.set("Cache-Control","no-store"); sendFile(res, path.join(PUBLIC_DIR, "credon/admin.html")); });
app.get("/credon/wallet", (req, res) => { res.set("Cache-Control","no-store,no-cache,must-revalidate"); sendFile(res, path.join(PUBLIC_DIR, "credon/wallet.html")); });
app.get("/credon/wallet", (req, res) => sendFile(res, path.join(PUBLIC_DIR, "credon/wallet.html")));
app.get("/credon/:path", (req, res) => sendFile(res, path.join(BUILD_DIR, "index.html")));

// Shop — serve specific pages when they exist, fallback to SPA
app.use("/shop/static", express.static(path.join(SHOP_BUILD_DIR, "static")));

// Generic handler: tries specific page, falls back to index.html
const serveShopPage = (req, res) => {
  const reqPath = req.path.replace(/^\/shop\/?/, '');
  
  // Try exact HTML file
  let filePath = path.join(SHOP_BUILD_DIR, reqPath);
  if (!filePath.endsWith('.html')) filePath += '.html';
  if (require('fs').existsSync(filePath)) return sendFile(res, filePath);
  
  // Try index.html in subdirectory
  filePath = path.join(SHOP_BUILD_DIR, reqPath, 'index.html');
  if (require('fs').existsSync(filePath)) return sendFile(res, filePath);
  
  // Try subdirectory/page.html pattern
  const parts = reqPath.split('/');
  if (parts.length === 2) {
    filePath = path.join(SHOP_BUILD_DIR, parts[0], parts[1] + '.html');
    if (require('fs').existsSync(filePath)) return sendFile(res, filePath);
  }
  
  // Fallback to SPA
  sendFile(res, path.join(SHOP_BUILD_DIR, 'index.html'));
};

app.get("/shop", serveShopPage);
app.use("/shop", (req, res, next) => { if (req.path !== "/shop") return next(); serveShopPage(req, res); });
// Catch all other /shop/* paths
app.use("/shop", (req, res) => { if (req.path === "/shop") return; serveShopPage(req, res); });

// Public store page
app.get("/shop/store/:slug", (req, res, next) => {
  // Don't catch settings/customization pages
  if (req.params.slug === 'settings' || req.params.slug === 'customization') return next();
  const storeFile = path.join(SHOP_BUILD_DIR, "store.html");
  if (require("fs").existsSync(storeFile)) return sendFile(res, storeFile);
  sendFile(res, path.join(SHOP_BUILD_DIR, "index.html"));
});

app.get("/api-docs", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "api-docs.html")));
app.get("/shop/checkout", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "checkout.html")));
app.get("/shop/bug-report", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "bug-report.html")));
app.get("/shop/reset-password", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "reset-password.html")));
app.get("/shop/listing/:id", (req, res) => sendFile(res, path.join(SHOP_BUILD_DIR, "listing/detail.html")));


// Referral redirect
app.get("/ref/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const db = require("./src/config/database");
    const result = await db.query("SELECT id FROM users WHERE referral_code = $1", [code]);
    if (result.rows.length > 0) {
      // Set referral cookie and redirect to landing
      res.cookie("hl_ref", code, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
    }
  } catch(e) {}
  res.redirect("/?ref=" + code);
});

// Landing page// Landing page


// Periodic image cleanup (every 6 hours)
const { cleanupExpiredListings, cleanupOrphanedImages } = require("./services/imageCleanup");
setInterval(async () => {
  try {
    await cleanupExpiredListings();
    await cleanupOrphanedImages();
  } catch(e) { console.error('Periodic cleanup error:', e.message); }
}, 6 * 60 * 60 * 1000);

// Weekly Business plan lottery (every Monday 9 AM check)
const { runWeeklyLottery } = require("./services/promotionEngine");
const { regenerateSitemap } = require("./services/sitemapService");

// Automated daily backups (3 AM)
const { runBackup } = require("./services/backupService");
setInterval(async () => {
  try {
    const now = new Date();
    if (now.getHours() === 3 && now.getMinutes() < 10) {
      await runBackup();
    }
  } catch(e) { console.error('Backup error:', e.message); }
}, 10 * 60 * 1000);

setInterval(async () => {
  try {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 10) {
      const result = await runWeeklyLottery();
      console.log('🎰 Weekly lottery result:', result);
    }
  } catch(e) { console.error('Lottery error:', e.message); }
}, 10 * 60 * 1000); // Check every 10 minutes

// Auto-regenerate sitemap hourly
setInterval(regenerateSitemap, 60 * 60 * 1000);
regenerateSitemap(); // Run on startup

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    await db.query('SELECT 1');
    res.json({ status: 'ok', uptime: process.uptime(), db: 'connected', timestamp: new Date().toISOString() });
  } catch(e) {
    res.status(503).json({ status: 'degraded', db: 'disconnected', error: e.message });
  }
});

// Metrics endpoint for monitoring dashboard
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const db = require('./db');
    const users = await db.query('SELECT COUNT(*) FROM users');
    const listings = await db.query("SELECT COUNT(*) FROM listings WHERE status = 'active'");
    const plans = await db.query('SELECT COUNT(*) FROM subscriptions');
    res.json({
      system: getMetrics(),
      db: {
        users: parseInt(users.rows[0].count),
        activeListings: parseInt(listings.rows[0].count),
        subscriptions: parseInt(plans.rows[0].count)
      },
      serverTime: new Date().toISOString()
    });
  } catch(e) {
    res.json({ system: getMetrics(), error: e.message });
  }
});

// Image recovery — upload replacement image for a listing
app.post('/api/admin/recover-image', async (req, res) => {
  try {
    const db = require('./db');
    const { listingId, image } = req.body;
    if (!listingId || !image) return res.status(400).json({ error: 'listingId and image required' });
    
    // Save the image
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const ext = (image.match(/^data:image\/(\w+)/)||['','jpg'])[1];
    const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const uploadDir = path.join(UPLOADS_DIR, 'listings');
    fs.mkdirSync(uploadDir, { recursive: true });
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(base64, 'base64'));
    
    // Update the listing
    const url = `/uploads/listings/${filename}`;
    await db.query('UPDATE listings SET images = ARRAY[$1] WHERE id = $2', [url, listingId]);
    res.json({ success: true, url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Dynamic sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const db = require('./db');
    const listings = await db.query("SELECT id, title, updated_at FROM listings WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500");
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <url><loc>https://heavenslive.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/shop/</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/shop/download</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n';
    xml += '  <url><loc>https://heavenslive.com/credon/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n';
    for (const l of listings.rows) {
      const id = l.id, d = new Date(l.updated_at).toISOString().split('T')[0];
      xml += '<url><loc>https://heavenslive.com/shop/listing/' + id + '</loc><lastmod>' + d + '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n';
    }
    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch(e) { res.status(500).send('Error generating sitemap'); }
});


(async () => { try { const db = require('./db'); await db.query("CREATE TABLE IF NOT EXISTS user_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), ip_address TEXT, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), last_active TIMESTAMPTZ DEFAULT NOW())"); } catch(e) {} })();


// One-time: translate all existing listings
app.post('/api/admin/translate-all-listings', async (req, res) => {
  try {
    const db = require('./db');
    const { autoTranslateListing } = require('./services/translationService');
    const listings = await db.query("SELECT id FROM listings WHERE status = 'active'");
    let count = 0, errors = 0;
    for (const l of listings.rows) {
      try { await autoTranslateListing(l.id); count++; } catch(e) { errors++; }
    }
    res.json({ success: true, translated: count, errors, total: listings.rows.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

(async () => { try { const db = require('./db'); await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_2fa_session TEXT'); await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_2fa_expires TIMESTAMPTZ'); console.log('✅ 2FA columns ready'); } catch(e) { console.log('2FA migration:', e.message); } })();

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

// Ensure user_sessions table exists
(async () => { try { const db = require('./db'); await db.query(`CREATE TABLE IF NOT EXISTS user_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), ip_address TEXT, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), last_active TIMESTAMPTZ DEFAULT NOW())`); } catch(e) {} })();
