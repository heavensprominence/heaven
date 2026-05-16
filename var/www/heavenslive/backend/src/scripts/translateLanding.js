// Quick landing page translations using Google Translate
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('public/locales/landing-en.json', 'utf8'));

const LANGS = ['ar','de','es','fa','fr','hi','ja','ko','pt','ru','sv','tl','tr','ur','vi','zh'];
const GOOGLE_CODES = {ar:'ar',de:'de',es:'es',fa:'fa',fr:'fr',hi:'hi',ja:'ja',ko:'ko',pt:'pt',ru:'ru',sv:'sv',tl:'tl',tr:'tr',ur:'ur',vi:'vi',zh:'zh-CN'};

function flatten(obj, prefix) {
  const result = {};
  for (const [k,v] of Object.entries(obj)) {
    const key = prefix ? prefix+'.'+k : k;
    if (typeof v === 'string') result[key] = v;
    else if (typeof v === 'object') Object.assign(result, flatten(v, key));
  }
  return result;
}

function unflatten(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

async function translateText(text, lang) {
  const gl = GOOGLE_CODES[lang];
  // Preserve HTML tags in translation
  const clean = text.replace(/<[^>]+>/g, '');
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl='+gl+'&dt=t&q='+encodeURIComponent(clean);
  const resp = await fetch(url);
  const data = await resp.json();
  if (data && data[0]) {
    let result = data[0].map(p => p[0]).join('');
    // Restore HTML tags in approximate positions
    const tags = text.match(/<[^>]+>/g);
    if (tags) {
      for (const tag of tags) {
        if (text.indexOf(tag) < clean.length) {
          const pos = Math.floor(result.length * (text.indexOf(tag) / text.length));
          result = result.substring(0, Math.min(pos, result.length)) + tag + result.substring(Math.min(pos, result.length));
        }
      }
    }
    return result;
  }
  return null;
}

async function main() {
  const flat = flatten(en);
  const strings = Object.values(flat);

  for (const lang of LANGS) {
    console.log('Translating to ' + lang + '...');
    const translated = {};
    const keys = Object.keys(flat);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const text = flat[key];
      process.stdout.write('.');
      try {
        const result = await translateText(text, lang);
        translated[key] = result || text;
        if (i < keys.length - 1) await new Promise(r => setTimeout(r, 200));
      } catch(e) {
        translated[key] = text;
      }
    }
    
    const nested = unflatten(translated);
    fs.writeFileSync('public/locales/landing-'+lang+'.json', JSON.stringify(nested, null, 2));
    console.log(' ✓');
  }
  console.log('Done!');
}

main().catch(console.error);
