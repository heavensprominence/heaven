const fs = require('fs');
const en = JSON.parse(fs.readFileSync('public/locales/shop-en.json', 'utf-8'));

async function gt(text, target) {
  try {
    const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(u);
    const j = await r.json();
    if (j[0] && j[0][0]) return j[0].map(p => p[0]).join('');
  } catch(e) {}
  return text;
}

const langs = {
  ar:'ar', de:'de', es:'es', fa:'fa', fr:'fr', hi:'hi', ja:'ja',
  ko:'ko', pt:'pt', ru:'ru', sv:'sv', tl:'tl', tr:'tr', ur:'ur', vi:'vi', zh:'zh-CN'
};

// All sections to sync
const sections = ['nav','header','filters','sort','listing','categories','footer','brand','page'];

async function syncOne(code, target) {
  const path = `public/locales/shop-${code}.json`;
  let loc = {};
  try { loc = JSON.parse(fs.readFileSync(path, 'utf-8')); } catch(e) {}
  
  let added = 0;
  for (const section of sections) {
    if (!en[section]) continue;
    if (!loc[section]) loc[section] = {};
    
    for (const [k, v] of Object.entries(en[section])) {
      if (!loc[section][k] || loc[section][k] === v) {
        // Missing or still English — translate
        if (code === 'en') { loc[section][k] = v; added++; }
        else {
          const tr = await gt(v, target);
          if (tr && tr !== v) { loc[section][k] = tr; added++; }
        }
      }
    }
  }
  
  fs.writeFileSync(path, JSON.stringify(loc, null, 2));
  return added;
}

(async () => {
  let total = 0;
  for (const [code, target] of Object.entries(langs)) {
    const n = await syncOne(code, target);
    console.log(`${code}: ${n} keys synced`);
    total += n;
  }
  console.log(`\nDone. ${total} total keys synced across 16 languages.`);
})();
