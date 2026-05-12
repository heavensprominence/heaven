/**
 * Bulk Translation Script
 * Translates all [TODO]-prefixed keys across all locale files.
 * Uses DeepL API (primary) with Google Translate fallback.
 * 
 * Usage:
 *   DEEPL_API_KEY=your-key node scripts/translateLocales.js
 * Or without key (Google only):
 *   node scripts/translateLocales.js
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../../../frontend-shop/src/i18n/locales');
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = DEEPL_API_KEY && !DEEPL_API_KEY.endsWith(':fx')
  ? 'https://api.deepl.com/v2/translate'
  : 'https://api-free.deepl.com/v2/translate';

const LANG_NAMES = {
  ar: 'Arabic', de: 'German', es: 'Spanish', fa: 'Persian',
  fr: 'French', hi: 'Hindi', ja: 'Japanese', ko: 'Korean',
  pt: 'Portuguese', ru: 'Russian', sv: 'Swedish', tl: 'Tagalog',
  tr: 'Turkish', ur: 'Urdu', vi: 'Vietnamese', zh: 'Chinese',
};

// DeepL language codes differ from our codes in some cases
const DEEPL_CODES = {
  ar: 'AR', de: 'DE', es: 'ES', fa: 'FA', fr: 'FR', hi: 'HI',
  ja: 'JA', ko: 'KO', pt: 'PT', ru: 'RU', sv: 'SV', tl: 'TL',
  tr: 'TR', ur: 'UR', vi: 'VI', zh: 'ZH',
  // DeepL doesn't support FA, HI, TL, UR — fall back to Google
};

// Google language codes
const GOOGLE_CODES = {
  ar: 'ar', de: 'de', es: 'es', fa: 'fa', fr: 'fr', hi: 'hi',
  ja: 'ja', ko: 'ko', pt: 'pt', ru: 'ru', sv: 'sv', tl: 'tl',
  tr: 'tr', ur: 'ur', vi: 'vi', zh: 'zh-CN',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateDeepL(texts, targetLang) {
  if (!DEEPL_API_KEY) return null;
  const dlCode = DEEPL_CODES[targetLang];
  if (!dlCode) return null; // DeepL doesn't support this language

  try {
    // Batch translate (DeepL supports multiple texts per request)
    const params = new URLSearchParams();
    params.append('target_lang', dlCode);
    params.append('source_lang', 'EN');
    for (const text of texts) {
      params.append('text', text);
    }

    const response = await fetch(DEEPL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (data.translations) {
      return data.translations.map(t => t.text);
    }
    console.error(`DeepL unexpected response for ${targetLang}:`, JSON.stringify(data).slice(0, 200));
  } catch (err) {
    console.error(`DeepL error for ${targetLang}:`, err.message);
  }
  return null;
}

async function translateGoogle(text, targetLang) {
  const glCode = GOOGLE_CODES[targetLang];
  if (!glCode) return null;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${glCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(part => part[0]).join('');
    }
  } catch (err) {
    console.error(`Google error for ${targetLang}:`, err.message);
  }
  return null;
}

async function translateText(text, targetLang) {
  if (!text || text.length < 2) return text;

  // Try DeepL first
  const deepLResult = await translateDeepL([text], targetLang);
  if (deepLResult && deepLResult[0] && deepLResult[0] !== text) {
    return deepLResult[0];
  }

  // Fallback to Google
  const googleResult = await translateGoogle(text, targetLang);
  if (googleResult && googleResult !== text) {
    return googleResult;
  }

  return null;
}

function findTodoKeys(obj, prefix = '') {
  const todos = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      todos.push(...findTodoKeys(value, fullKey));
    } else if (typeof value === 'string' && value.startsWith('[TODO] ')) {
      todos.push({ key: fullKey, englishText: value.slice(7) }); // Remove "[TODO] " prefix
    }
  }
  return todos;
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

async function translateLocale(localeCode) {
  const filePath = path.join(LOCALES_DIR, `${localeCode}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const todos = findTodoKeys(data);

  if (todos.length === 0) {
    console.log(`  ✅ ${localeCode}: No TODO entries — fully translated!`);
    return { translated: 0, failed: 0 };
  }

  const langName = LANG_NAMES[localeCode] || localeCode;
  console.log(`  📝 ${localeCode} (${langName}): ${todos.length} entries to translate...`);
  process.stdout.write(`     `);

  let translated = 0;
  let failed = 0;
  const BATCH_SIZE = 25;
  const batches = [];

  // Group into batches for efficiency
  for (let i = 0; i < todos.length; i += BATCH_SIZE) {
    batches.push(todos.slice(i, i + BATCH_SIZE));
  }

  let batchNum = 0;
  for (const batch of batches) {
    batchNum++;
    // DeepL batch translation (more efficient)
    if (DEEPL_API_KEY) {
      const texts = batch.map(t => t.englishText);
      const dlResults = await translateDeepL(texts, localeCode);
      
      if (dlResults) {
        for (let i = 0; i < batch.length; i++) {
          if (dlResults[i] && dlResults[i] !== batch[i].englishText) {
            setNestedValue(data, batch[i].key, dlResults[i]);
            translated++;
          } else {
            // Fall back to Google for this one
            const googleResult = await translateGoogle(batch[i].englishText, localeCode);
            if (googleResult) {
              setNestedValue(data, batch[i].key, googleResult);
              translated++;
            } else {
              failed++;
            }
          }
        }
        process.stdout.write('.');
        if (batchNum < batches.length) await sleep(200);
        continue;
      }
    }

    // Individual Google translations
    for (const item of batch) {
      const result = await translateGoogle(item.englishText, localeCode);
      if (result) {
        setNestedValue(data, item.key, result);
        translated++;
      } else {
        failed++;
      }
      process.stdout.write('.');
    }
    if (batchNum < batches.length) await sleep(500);
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n     ✅ ${translated} translated, ${failed} failed`);
  return { translated, failed };
}

async function main() {
  console.log('🌍 Bulk Translation Engine');
  console.log(`   DeepL: ${DEEPL_API_KEY ? '✅ configured' : '❌ not configured (Google only)'}`);
  console.log(`   Source: English → 16 target languages\n`);

  const localeFiles = fs.readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'en.json')
    .map(f => f.replace('.json', ''));

  let totalTranslated = 0;
  let totalFailed = 0;

  for (const locale of localeFiles) {
    const { translated, failed } = await translateLocale(locale);
    totalTranslated += translated;
    totalFailed += failed;
  }

  console.log(`\n📊 Total: ${totalTranslated} translated, ${totalFailed} failed`);
  if (totalTranslated > 0) {
    console.log('   Running key parity check...\n');
    require('./checkLocales');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
