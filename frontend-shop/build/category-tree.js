// Category Tree — loaded by shop page
var CAT_CACHE = {};

async function treeFetchCats(lang) {
  lang = lang || localStorage.getItem('hl-lang') || 'en';
  if (CAT_CACHE[lang]) return CAT_CACHE[lang];
  try {
    var r = await fetch('/api/shop/categories?lang=' + lang);
    var d = await r.json();
    CAT_CACHE[lang] = d.categories || [];
    return CAT_CACHE[lang];
  } catch (e) { console.error('treeFetchCats:', e); return []; }
}

async function treeInit() {
  var lang = localStorage.getItem('hl-lang') || 'en';
  var cats = await treeFetchCats(lang);
  var tree = document.getElementById('catList');
  if (!tree) return;

  var total = 0;
  cats.forEach(function(c) { total += (c.count || 0); });

  var html = '<div class="cat-item sel" data-cat="" onclick="F.cat=\'\';F.p=1;load();updateCats()"><span>🏠</span>All Listings<span class="n">' + total + '</span></div>';

  cats.forEach(function(c) {
    var icon = c.icon || '📦';
    var name = c.name || c.slug;
    html += '<div class="cat-item" data-cat="' + c.slug + '" onclick="F.cat=\'' + c.slug + '\';F.p=1;load();updateCats()">';
    html += '<span>' + icon + '</span>' + name + '<span class="n" style="margin-left:auto;font-size:.7rem;color:var(--muted)">' + (c.count || 0) + '</span>';
    html += '</div>';
    html += '<div id="sub-' + c.slug + '" class="subtree" style="display:none;padding-left:20px"></div>';
  });

  tree.innerHTML = html;

  // Style patches
  var titleEl = document.querySelector('.sidebar h3');
  if (titleEl) titleEl.setAttribute('data-i18n', 'categories.title');
}

function updateCats() {
  var items = document.querySelectorAll('#catList .cat-item');
  items.forEach(function(el) { el.classList.remove('sel'); });
  if (!F.cat) { items[0].classList.add('sel'); return; }
  var active = document.querySelector('#catList .cat-item[data-cat="' + F.cat + '"]');
  if (active) active.classList.add('sel');
  else items[0].classList.add('sel');
}

function resetCategoryTree() {
  CAT_CACHE = {};
  treeInit();
}

document.addEventListener('DOMContentLoaded', function() { treeInit(); });
window.addEventListener('langChanged', function() { resetCategoryTree(); });
