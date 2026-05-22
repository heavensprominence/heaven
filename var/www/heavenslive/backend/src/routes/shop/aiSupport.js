/**
 * AI Support Chat — 24/7 customer support
 * Smart keyword matching with 12 response categories
 */
const express = require('express');
const router = express.Router();

const RESPONSES = [
  { p: [/download|app|install|get.*app|desktop|mobile|android|ios/i], r: 'Download free for all platforms at heavenslive.com/shop/download — Linux, Windows, macOS, Android, iOS.' },
  { p: [/price|cost|fee|plan|subscription|pricing|pro|business/i], r: 'Free to join! Pro plan ($9/mo) unlocks featured listings, analytics, bulk import. Business ($29/mo) adds priority support.' },
  { p: [/wallet|credontoken|credon|send.*money|exchange|loan|balance/i], r: 'Credon Wallet is borderless banking — send money, exchange 100+ currencies, get interest-bearing loans. Visit /credon/wallet!' },
  { p: [/listing|sell|post|create.*item|classified|auction/i], r: 'Create a listing at /shop/create. Our AI assistant generates your listing from a plain description!' },
  { p: [/shipping|delivery|ship|pickup|worldwide/i], r: 'Worldwide shipping + local pickup available. Sellers set shipping options per listing.' },
  { p: [/language|translate|persian|farsi|arabic|chinese|japanese|korean|french|spanish/i], r: '17 languages supported! Select your language from the top navigation dropdown.' },
  { p: [/payment|pay|paypal|bitcoin|crypto|currency|usd/i], r: 'Pay via PayPal or Credon Wallet. 100+ currencies with live exchange rates. Guest checkout available!' },
  { p: [/featured|featured.*listing|top.*listing|promot/i], r: 'Feature your listing at the top of search results! Included with Pro/Business plans, or $1/mo via PayPal.' },
  { p: [/affiliate|refer|commission|earn/i], r: 'Our affiliate program pays commissions on every purchase by people you refer! Get your link at /shop/affiliate-v2.' },
  { p: [/password|reset|forgot|login.*problem|can.*log/i], r: 'Reset your password at /shop/reset-password. Still stuck? Visit /shop/contact.' },
  { p: [/support|help|contact|issue|problem|bug/i], r: 'For direct support visit /shop/contact or report bugs at /shop/bug-report. We respond within 24 hours!' },
  { p: [/hi|hello|hey|salam|hola|bonjour/i], r: 'Hello! 👋 I can help with downloads, plans, wallet, listings, payments, and more. What would you like to know?' },
];

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.length < 2) return res.status(400).json({ error: 'Please ask a question.' });
    for (const r of RESPONSES) { if (r.p.some(p => p.test(message))) return res.json({ reply: r.r, timestamp: new Date().toISOString() }); }
    res.json({ reply: 'I can help with downloads, plans, wallet, listings, payments, and more! Try: "How do I download the app?" or "What plans are available?"', timestamp: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: 'Support chat temporarily unavailable.' }); }
});

module.exports = router;
