/**
 * AI Listing Import Engine
 * Paste URL from eBay/Etsy/etc — AI generates complete HeavensLive listing
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');

router.post('/import-listing', verifyToken, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    // Fetch the page content
    const urlModule = require('url');
    let html = '';
    try {
      const https = require('https');
      const http = require('http');
      const parsed = new urlModule.URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      html = await new Promise((resolve, reject) => {
        mod.get(url, { timeout: 15000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk.toString().substring(0, 200000));
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
    } catch (e) {
      return res.status(400).json({ error: 'Could not fetch URL. Check the link and try again.' });
    }

    // Extract key info
    const title = extractMeta(html, 'og:title') || extractTag(html, 'title') || '';
    const desc = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
    const price = extractPrice(html);
    const images = extractImages(html);
    const platform = detectPlatform(url);

    // Clean up extracted data
    const cleanTitle = title.replace(/\s*[-|]\s*(eBay|Etsy|Amazon|Shopify).*/i, '').trim().substring(0, 80);
    const cleanDesc = desc.replace(/<[^>]+>/g, '').trim().substring(0, 500);
    const cleanImages = images.filter(img => img.startsWith('http')).slice(0, 5);

    res.json({
      success: true,
      imported: {
        title: cleanTitle || `Item from ${platform || 'external site'}`,
        description: cleanDesc || 'Imported from external listing. Review and update details.',
        price_cents: price ? Math.round(price * 100) : 0,
        images: cleanImages,
        platform,
        originalUrl: url
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function extractMeta(html, name) {
  const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)`, 'i');
  const match = html.match(regex);
  return match ? match[1] : '';
}

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractPrice(html) {
  const patterns = [
    /(?:price|amount)["'\s:]+(?:[$€£])?(\d+[\.,]?\d*)/i,
    /(?:$|€|£)\s*(\d+[\.,]?\d*)/g,
    /"price"\s*:\s*"?(\d+[\.,]?\d*)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat((match[1] || match[0]).replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (val > 0.01 && val < 1000000) return val;
    }
  }
  return null;
}

function extractImages(html) {
  const images = [];
  // og:image
  const ogImg = extractMeta(html, 'og:image');
  if (ogImg) images.push(ogImg);
  // img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1] && !match[1].includes('data:') && !match[1].includes('icon')) {
      images.push(match[1]);
    }
    if (images.length > 10) break;
  }
  return images;
}

function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('ebay')) return 'eBay';
  if (lower.includes('etsy')) return 'Etsy';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('facebook.com/marketplace')) return 'Facebook Marketplace';
  if (lower.includes('craigslist')) return 'Craigslist';
  return 'External Site';
}

module.exports = router;
