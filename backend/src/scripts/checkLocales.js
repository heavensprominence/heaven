/**
 * Localization Key Parity Checker
 * Run: node scripts/checkLocales.js
 * 
 * Compares all locale files against English (the canonical set).
 * Reports missing keys and generates fill-in templates.
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../../../frontend-shop/src/i18n/locales');
const EN_FILE = path.join(LOCALES_DIR, 'en.json');

function getKeys(obj, prefix = '') {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      for (const key of getKeys(v, full)) keys.add(key);
    } else {
      keys.add(full);
    }
  }
  return keys;
}

function getValue(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

function setValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

const en = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const enKeys = getKeys(en);

const localeFiles = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith('.json') && f !== 'en.json');

console.log(`🌍 Locale Key Parity Report`);
console.log(`   Canonical file: en.json (${enKeys.size} keys)`);
console.log(`   Target locales: ${localeFiles.length}\n`);

let totalMissing = 0;

for (const file of localeFiles) {
  const filePath = path.join(LOCALES_DIR, file);
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const localeKeys = getKeys(locale);
  const missing = [...enKeys].filter(k => !localeKeys.has(k));
  const extra = [...localeKeys].filter(k => !enKeys.has(k));
  
  totalMissing += missing.length;
  
  console.log(`📄 ${file}: ${localeKeys.size} keys (${missing.length} missing, ${extra.length} extra)`);
  
  if (missing.length > 0) {
    // Auto-fill missing keys with English values (marked with TODO prefix)
    for (const key of missing) {
      setValue(locale, key, `[TODO] ${getValue(en, key)}`);
    }
    fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n');
    console.log(`   ✅ Auto-filled ${missing.length} missing keys with [TODO] prefix`);
    console.log(`   Missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
  }
  
  if (extra.length > 0) {
    console.log(`   ⚠️ Extra keys (not in English): ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '...' : ''}`);
  }
}

console.log(`\n📊 Total: ${totalMissing} missing keys filled across ${localeFiles.length} locales.`);
console.log(`   Review files for [TODO] entries and translate them.`);
