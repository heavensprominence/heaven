/**
 * AI Support Chat — 24/7 customer support
 * Gemini API (primary) with keyword matching (fallback)
 */
const express = require('express');
const router = express.Router();
const https = require('https');

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA90C6nwnZPSJsKj9Nts__bzCX9a7SDVU8';

const KNOWLEDGE = `You are a helpful support assistant for HeavensLive, a divine marketplace with borderless banking (Credon Wallet). 
FACTS:
- Free to join, free to browse, free to list items
- Available on web, Linux, Windows, macOS, Android, iOS
- Download at heavenslive.com/shop/download
- Pro plan: $9/mo (featured listings, analytics, bulk import)
- Business plan: $29/mo (priority support, more features)
- Credon Wallet: send money, exchange 100+ currencies, interest-bearing loans
- 17 languages, 100+ currencies, live exchange rates
- PayPal and Credon Wallet accepted, guest checkout available
- Affiliate program: earn commissions on referrals
- Prayer audio available on landing page and shop nav
- AI Listing Assistant generates listings from plain descriptions
- Create listings at /shop/create, Wallet at /credon/wallet
- Support: /shop/contact, Bug reports: /shop/bug-report
- Password reset: /shop/reset-password
Keep answers concise (1-3 sentences). Be warm and helpful.`;

// Fallback keyword responses
const FALLBACKS = [
  { p: [/download|app|install|get.*app|desktop|mobile|android|ios/i], r: 'Download free for all platforms at heavenslive.com/shop/download' },
  { p: [/price|cost|fee|plan|subscription|pricing|pro|business/i], r: 'Free to join! Pro plan ($9/mo), Business ($29/mo).' },
  { p: [/wallet|credontoken|credon|send.*money|exchange|loan|balance/i], r: 'Credon Wallet: send money, exchange 100+ currencies, get loans. Visit /credon/wallet!' },
  { p: [/listing|sell|post|create.*item|classified|auction/i], r: 'Create a listing at /shop/create — our AI assistant generates it from plain description!' },
  { p: [/language|translate/i], r: '17 languages supported! Use the language dropdown in the top navigation.' },
  { p: [/payment|pay|paypal|bitcoin|crypto|currency|usd/i], r: 'PayPal and Credon Wallet accepted. 100+ currencies, guest checkout available.' },
  { p: [/affiliate|refer|commission|earn/i], r: 'Earn commissions on referrals! Get your link at /shop/affiliate-v2.' },
  { p: [/hi|hello|hey|salam|hola|bonjour/i], r: 'Hello! 👋 I can help with downloads, plans, wallet, listings, payments, and more. Ask away!' },
];

async function askGemini(message) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: KNOWLEDGE + '\n\nUser asks: ' + message }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) resolve(text.trim());
          else reject(new Error('No response'));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.length < 2) return res.status(400).json({ error: 'Please ask a question.' });
    
    // Try Gemini first
    try {
      const reply = await askGemini(message);
      if (reply && reply.length > 5) return res.json({ reply, timestamp: new Date().toISOString() });
    } catch(e) { /* fall through to keyword matching */ }
    
    // Fallback: keyword matching
    for (const f of FALLBACKS) {
      if (f.p.some(p => p.test(message))) return res.json({ reply: f.r, timestamp: new Date().toISOString() });
    }
    res.json({ reply: 'I can help with downloads, plans, wallet, listings, and more! Try asking about any feature.', timestamp: new Date().toISOString() });
  } catch(e) { res.status(500).json({ error: 'Support chat temporarily unavailable.' }); }
});

module.exports = router;
