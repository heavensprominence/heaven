/**
 * AI Support Chat — 24/7 customer support, 17 languages
 * Floating chat widget that lives on every page
 */
const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

// Knowledge base — common questions about HeavensLive
const KNOWLEDGE = `
HEAVENSLIVE KNOWLEDGE BASE:
- HeavensLive is a divine marketplace with Credon digital wallet
- Available on web, Linux, Windows, macOS, Android, iOS
- Free to join, free to browse, free to list items
- Pro plan unlocks featured listings, analytics, bulk import ($9/mo)
- Business plan adds priority support, more featured slots ($29/mo)
- Credon Wallet: send money, exchange currencies, get loans
- Prayer audio available on landing page and shop nav
- 17 languages supported
- 100+ currencies via live exchange rates
- PayPal and Credon Wallet accepted for payments
- Guest checkout available — no account needed to browse
- Disputes resolved within 48 hours
- Affiliate program: earn commissions on sales you refer
- Download apps at heavenslive.com/shop/download
- Contact support: heavenslive.com/shop/contact
- Bug reports: heavenslive.com/shop/bug-report
- Password reset: heavenslive.com/shop/reset-password
`;

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.length < 2) {
      return res.status(400).json({ error: 'Please ask a question.' });
    }

    const historyStr = history.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const prompt = `You are a helpful support assistant for HeavensLive. Answer questions based on this knowledge:

${KNOWLEDGE}

Conversation history:
${historyStr}

User: ${message}

Keep answers concise (1-3 sentences). Be friendly. If you don't know, suggest visiting /shop/contact. Never make up features that aren't listed above.`;

    const result = execSync(`gemini --output-format text "${prompt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      encoding: 'utf-8',
      timeout: 15000,
      maxBuffer: 1024 * 512,
    });

    res.json({
      reply: result.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('AI Support Chat error:', e.message);
    res.status(500).json({ error: 'Support chat temporarily unavailable. Please visit /shop/contact.' });
  }
});

module.exports = router;
