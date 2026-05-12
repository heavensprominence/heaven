/**
 * Translation Service
 * Primary: DeepL API (superior quality, 500k chars/month free)
 * Fallback: Google Translate (free, reliable)
 * Self-hosted: LibreTranslate (for privacy-sensitive content)
 */
const db = require('../db');
require('dotenv').config();

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = DEEPL_API_KEY && !DEEPL_API_KEY.endsWith(':fx')
  ? 'https://api.deepl.com/v2/translate'
  : 'https://api-free.deepl.com/v2/translate';
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5001';

// All supported target languages
const SUPPORTED_LANGUAGES = [
  'ar', 'de', 'en', 'es', 'fa', 'fr', 'hi', 'ja', 'ko',
  'pt', 'ru', 'sv', 'tl', 'tr', 'ur', 'vi', 'zh'
];

// Simple language detection (for routing to proper translation)
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';
  // Detect Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  // Detect CJK
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  // Detect Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  // Detect Devanagari
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

// === DeepL Translation (primary) ===
async function translateWithDeepL(text, sourceLang, targetLang) {
  if (!DEEPL_API_KEY) return null;
  try {
    // DeepL uses 'EN', 'DE', etc. — uppercase
    const dlSource = sourceLang.toUpperCase();
    const dlTarget = targetLang === 'en' ? 'EN-US' : targetLang.toUpperCase();
    
    const params = new URLSearchParams({
      text,
      target_lang: dlTarget,
    });
    if (sourceLang !== 'auto') params.append('source_lang', dlSource);
    
    const response = await fetch(DEEPL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const data = await response.json();
    if (data.translations && data.translations[0]) {
      return data.translations[0].text;
    }
    console.error('DeepL unexpected response:', JSON.stringify(data).slice(0, 200));
  } catch (err) {
    console.error('DeepL error:', err.message);
  }
  return null;
}

// === Google Translate (fallback) ===
async function translateWithGoogle(text, sourceLang, targetLang) {
  try {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      const result = data[0].map(part => part[0]).join('');
      if (result && result !== text) return result;
    }
  } catch (err) {
    console.error('Google translate error:', err.message);
  }
  return null;
}

// === LibreTranslate (self-hosted fallback) ===
async function translateWithLibreTranslate(text, sourceLang, targetLang) {
  try {
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'auto' ? 'en' : sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });
    const data = await response.json();
    if (data.translatedText && data.translatedText !== text) {
      return data.translatedText;
    }
  } catch (err) {
    console.error('LibreTranslate error:', err.message);
  }
  return null;
}

// === Retry wrapper with exponential backoff ===
async function withRetry(fn, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (e) { /* fall through to next attempt */ }
    if (i < maxRetries) await new Promise(r => setTimeout(r, Math.pow(2, i) * 500));
  }
  return null;
}

// === Main translation function: DeepL → Google → LibreTranslate ===
async function translateText(text, sourceLang, targetLang) {
  if (!text || sourceLang === targetLang) return text;
  if (targetLang === 'en' && detectLanguage(text) === 'en') return text;

  // Try DeepL first (best quality)
  let result = await withRetry(() => translateWithDeepL(text, sourceLang, targetLang));
  if (result) return result;

  // Fallback to Google Translate
  result = await withRetry(() => translateWithGoogle(text, sourceLang, targetLang));
  if (result) return result;

  // Last resort: LibreTranslate
  result = await withRetry(() => translateWithLibreTranslate(text, sourceLang, targetLang));
  if (result) return result;

  // All failed — return original
  console.error(`All translation engines failed for ${sourceLang}→${targetLang}`);
  return text;
}

// === Batch translate a listing to all supported languages ===
async function autoTranslateListing(listingId) {
  try {
    const result = await db.query(
      'SELECT title, description FROM listings WHERE id = $1',
      [listingId]
    );
    if (result.rows.length === 0) return;

    const listing = result.rows[0];
    const title = listing.title;
    const description = listing.description;
    const sourceLang = detectLanguage(title);

    console.log(`Auto-translating listing ${listingId} (source: ${sourceLang})`);

    let count = 0;
    for (const targetLang of SUPPORTED_LANGUAGES) {
      if (targetLang === sourceLang) continue; // Skip source language
      try {
        const translatedTitle = await translateText(title, sourceLang, targetLang);
        if (!translatedTitle || translatedTitle === title) {
          console.log(`  - ${targetLang} (no useful result)`);
          continue;
        }

        const translatedDesc = description
          ? await translateText(description, sourceLang, targetLang)
          : null;

        await db.query(
          `INSERT INTO listing_translations (listing_id, language_code, title, description, translated_by)
           VALUES ($1, $2, $3, $4, 'auto')
           ON CONFLICT (listing_id, language_code)
           DO UPDATE SET title = $3, description = $4, updated_at = NOW()`,
          [listingId, targetLang, translatedTitle, translatedDesc]
        );
        count++;
        console.log(`  ✓ ${targetLang}`);
      } catch (err) {
        console.error(`  ✗ ${targetLang}: ${err.message}`);
      }
    }
    console.log(`✓ Listing ${listingId}: ${count}/${SUPPORTED_LANGUAGES.length - 1} languages`);
  } catch (error) {
    console.error('autoTranslateListing error:', error);
  }
}

// === Translate a chat message ===
async function translateMessage(messageText, targetLang) {
  if (!messageText) return null;
  const sourceLang = detectLanguage(messageText);
  return await translateText(messageText, sourceLang, targetLang);
}

// === Get listing with translation applied ===
async function getTranslatedListing(listingId, preferredLang) {
  try {
    const result = await db.query('SELECT * FROM listings WHERE id = $1', [listingId]);
    if (result.rows.length === 0) return null;

    const listing = result.rows[0];
    if (!preferredLang || preferredLang === 'en') {
      return { ...listing, translated: false };
    }

    const transResult = await db.query(
      'SELECT * FROM listing_translations WHERE listing_id = $1 AND language_code = $2',
      [listingId, preferredLang]
    );

    if (transResult.rows.length > 0) {
      const t = transResult.rows[0];
      return {
        ...listing,
        title: t.title || listing.title,
        description: t.description || listing.description,
        translated: true,
      };
    }

    // Trigger background translation for next time
    autoTranslateListing(listingId).catch(err =>
      console.error('Background translation failed:', err.message)
    );

    return { ...listing, translated: false };
  } catch (error) {
    console.error('getTranslatedListing error:', error);
    return null;
  }
}

module.exports = {
  autoTranslateListing,
  getTranslatedListing,
  translateMessage,
  translateText,
  detectLanguage,
  SUPPORTED_LANGUAGES,
};
