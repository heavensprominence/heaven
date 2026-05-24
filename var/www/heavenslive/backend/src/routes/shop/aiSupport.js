/**
 * AI Support Chat — DeepSeek-powered natural conversation
 * Localized greetings, full conversation flow, keyword fallback
 */
const express = require('express');
const router = express.Router();
const https = require('https');

const DEEPSEEK_KEY = 'sk-7edba9a43a1649408328011f3e758ee0';

const SYSTEM_PROMPT = `You are the HeavensLive support assistant — warm, helpful, concise.

HeavensLive is a divine marketplace with Credon digital wallet:
- Free to join, browse, and list. Download at heavnslive.com/shop/download for Linux, Windows, macOS, Android, iOS
- Pro plan $9/mo: featured listings, analytics, bulk import. Business $29/mo: priority support
- Credon Wallet: send money, exchange 100+ currencies, interest-bearing loans
- 17 languages, PayPal + Credon Wallet payments, guest checkout
- Affiliate program: earn commissions on referrals at /shop/affiliate-v2
- AI Listing Assistant generates listings from plain descriptions at /shop/create
- Prayer audio on landing page and shop navigation
- Support: /shop/contact | Email: service@heavenslive.com | Bug reports: /shop/bug-report | Password reset: /shop/reset-password

Rules: Keep answers to 1-3 sentences. Be friendly. If unsure, suggest /shop/contact.
IMPORTANT: Always reply in the same language the user writes in. If they write in Persian, reply in Persian. If French, reply in French. Etc.`;

function askDeepSeek(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 250,
      temperature: 0.7
    });
    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const text = j.choices?.[0]?.message?.content;
          if (text) resolve(text.trim());
          else reject(new Error(j.error?.message || 'No response'));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// In-memory conversation store (per-session, ephemeral)
const conversations = {};

router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || message.length < 2) return res.status(400).json({ error: 'Please ask a question.' });

    const sid = sessionId || 'default';
    if (!conversations[sid]) {
      conversations[sid] = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];
    }
    conversations[sid].push({ role: 'user', content: message });

    // Keep only last 15 messages to avoid token bloat
    if (conversations[sid].length > 16) {
      conversations[sid] = [conversations[sid][0], ...conversations[sid].slice(-15)];
    }

    try {
      const reply = await askDeepSeek(conversations[sid]);
      conversations[sid].push({ role: 'assistant', content: reply });
      return res.json({ reply, timestamp: new Date().toISOString() });
    } catch(e) {
      // Fallback: keyword matching
      const KEYWORDS = [
        [/download|app|install/i, 'Download free for all platforms at heavenslive.com/shop/download'],
        [/plan|price|cost|subscription|pricing|pro|business/i, 'Free to join! Pro plan $9/mo, Business $29/mo.'],
        [/wallet|credontoken|credon|send.*money|exchange|loan/i, 'Credon Wallet: send, exchange, loans. Visit /credon/wallet'],
        [/listing|sell|post|create/i, 'Create a listing at /shop/create — AI assistant helps!'],
        [/language|translate/i, '17 languages! Use the language dropdown in the top nav.'],
        [/payment|pay|paypal/i, 'PayPal and Credon Wallet. Guest checkout available.'],
        [/affiliate|refer|commission/i, 'Earn commissions! Get your link at /shop/affiliate-v2'],
        [/hi|hello|hey|salam/i, 'Hello! Ask me anything about HeavensLive.'],
      ];
      for (const [p, r] of KEYWORDS) {
        if (p.test(message)) return res.json({ reply: r, timestamp: new Date().toISOString() });
      }
      return res.json({ reply: 'I can help! Ask about downloads, plans, wallet, listings, payments, or anything HeavensLive.', timestamp: new Date().toISOString() });
    }
  } catch(e) {
    res.status(500).json({ error: 'Support chat temporarily unavailable.' });
  }
});

module.exports = router;
