/**
 * AI Listing Assistant — Natural language → complete listing
 * Uses Gemini CLI to analyze description and generate listing data.
 */
const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const { verifyToken } = require('../../middleware/auth');

router.post('/listing-suggest', verifyToken, async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.length < 10) {
      return res.status(400).json({ error: 'Please describe your item in at least 10 characters.' });
    }

    // Fetch categories for context
    const db = require('../../db');
    const cats = await db.query("SELECT slug, name FROM shop_categories WHERE parent_slug IS NULL OR parent_slug = ''");
    const categoryOptions = cats.rows.map(c => `${c.slug}: ${c.name}`).join(', ');

    const prompt = `You are a listing assistant for HeavensLive marketplace. Given a seller's description, generate a complete listing.

Seller says: "${description}"

Available categories: ${categoryOptions}

Return ONLY valid JSON (no markdown, no backticks) with these fields:
{
  "title": "concise listing title (max 80 chars)",
  "description": "well-written, engaging description (2-4 sentences, highlight key selling points, use friendly tone)",
  "category": "the best category slug from the available list",
  "suggested_price_usd": number (estimate fair price in USD, 0 for free items),
  "type": "mall" (fixed price), "auction" (bidding), or "reverse_auction" (wanted/ad),
  "keywords": ["5-10", "search", "keywords"],
  "shipping_suggestion": "brief shipping recommendation"
}`;

    const result = execSync(`gemini --output-format json "${prompt.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    let parsed;
    try {
      // Try direct parse
      parsed = JSON.parse(result.trim());
    } catch {
      // Try extracting JSON from response
      const match = result.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) return res.status(500).json({ error: 'AI failed to generate suggestions' });

    res.json({
      success: true,
      suggestions: {
        title: parsed.title || '',
        description: parsed.description || '',
        category: parsed.category || '',
        price_cents: Math.round((parsed.suggested_price_usd || 0) * 100),
        type: parsed.type || 'mall',
        keywords: parsed.keywords || [],
        shipping_suggestion: parsed.shipping_suggestion || '',
      }
    });
  } catch (e) {
    console.error('AI Listing Assistant error:', e.message);
    res.status(500).json({ error: 'AI generation failed. Try again or fill manually.' });
  }
});

module.exports = router;
