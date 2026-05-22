// HeavensLive Shared i18n v2 — include in all pages
(function(){
  var LANG_KEY='hl-lang';
  var currentLang=localStorage.getItem(LANG_KEY)||'en';
  

  // === FIRST PASS: Tag all translatable elements with data-original ===
  function tagOriginals() {
    // All text elements
    document.querySelectorAll('h1,h2,h3,h4,a,button,label,.muted,.label,.nav-brand,p,span,th,td,li,option,div[data-i18n]').forEach(function(el) {
      if (el.getAttribute('data-original')) return;
      // Only tag if it has direct text content (not just child elements)
      var ownText = '';
      el.childNodes.forEach(function(n) {
        if (n.nodeType === 3) ownText += n.textContent;
      });
      if (ownText.trim() && ownText.trim().length < 100) {
        el.setAttribute('data-original', ownText.trim());
      }
    });
  }
  
  // Run tagging early, before translations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { tagOriginals(); });
  } else {
    tagOriginals();
  }

  // Inject language selector into nav
  function injectLangSelector(){
    if(document.getElementById('langSel')||document.getElementById('langSelect')||document.getElementById('i18nLangSel'))return;
    var navs=document.querySelectorAll('nav');
    navs.forEach(function(nav){
      if(nav.querySelector('#i18nLangSel')) return;
      var sel=document.createElement('select');
      sel.id='i18nLangSel';
      sel.onchange=function(){switchLang(this.value)};
      sel.style.cssText='appearance:none;padding:4px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#E8E6E3;font-size:.75rem;cursor:pointer;margin-right:10px';
      sel.innerHTML='<option value="en">🌐 English</option><option value="ar">🇸🇦 العربية</option><option value="fa">🇮🇷 فارسی</option><option value="fr">🇫🇷 Français</option><option value="zh">🇨🇳 中文</option><option value="ja">🇯🇵 日本語</option><option value="ko">🇰🇷 한국어</option><option value="de">🇩🇪 Deutsch</option><option value="es">🇪🇸 Español</option><option value="ru">🇷🇺 Русский</option><option value="hi">🇮🇳 हिन्दी</option><option value="pt">🇵🇹 Português</option><option value="sv">🇸🇪 Svenska</option><option value="tl">🇵🇭 Tagalog</option><option value="tr">🇹🇷 Türkçe</option><option value="ur">🇵🇰 اردو</option><option value="vi">🇻🇳 Tiếng Việt</option>';
      sel.value=currentLang;
      var brand=nav.querySelector('.nav-brand');
      if(brand) brand.parentNode.insertBefore(sel,brand);
      else nav.insertBefore(sel,nav.firstChild);
    });
  }
  
  window.switchLang=function(lang){
    if(!lang) return;
    currentLang=lang;
    localStorage.setItem(LANG_KEY,lang);
    document.documentElement.lang=lang;
    document.documentElement.dir=['ar','fa','ur'].includes(lang)?'rtl':'ltr';
    // Update any existing hardcoded language selectors
    document.querySelectorAll('select[id="langSelect"], select[id="langSel"]').forEach(function(s){s.value=lang});
    loadAndApply(lang);
  };
  
  function loadAndApply(lang){console.log('i18n: loadAndApply('+lang+') nav a count='+document.querySelectorAll('nav a').length);
  if(typeof resetCategoryTree==='function')resetCategoryTree();
    Promise.all([
      fetch('/locales/landing-'+lang+'.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null}),
      fetch('/locales/shop-'+lang+'.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null}),
      fetch('/locales/'+lang+'.json').then(function(r){return r.ok?r.json():null}).catch(function(){return null})
    ]).then(function(results){
      var landing=results[0],shop=results[1],credontoken=results[2];
      // Merge credontoken + wallet keys into landing so applyLanding picks them up
      if(!landing) landing={};
      if(credontoken){for(var k in credontoken){if(credontoken.hasOwnProperty(k))landing[k]=credontoken[k]}}
      applyLanding(landing);
      applyShopI18n(shop);
      applyShop(shop);
      translateCommonStrings(landing,shop);
    });
  }
  
  // Pre-load English locales as fallback
  var EN_SHOP = null, EN_LANDING = null, EN_CREDON = null;
  fetch('/locales/shop-en.json').then(function(r){return r.json()}).then(function(j){EN_SHOP=j}).catch(function(){});
  fetch('/locales/landing-en.json').then(function(r){return r.json()}).then(function(j){EN_LANDING=j}).catch(function(){});
  fetch('/locales/en.json').then(function(r){return r.json()}).then(function(j){EN_CREDON=j}).catch(function(){});

  function applyLanding(t){
    if(!t) return;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key=el.getAttribute('data-i18n'),parts=key.split('.'),val=t;
      for(var i=0;i<parts.length;i++){if(!val)break;val=val[parts[i]]}
      if(typeof val!=='string'||!val){
        // Fall back to landing-en, then shop-en, then data-original
        if(EN_LANDING){val=EN_LANDING;for(var j=0;j<parts.length;j++){if(!val)break;val=val[parts[j]]}}
        if(typeof val!=='string'||!val){if(EN_SHOP){val=EN_SHOP;for(var k=0;k<parts.length;k++){if(!val)break;val=val[parts[k]]}}}
        if(typeof val!=='string'||!val){val=el.getAttribute('data-original')||el.textContent.trim()}
      }
      if(typeof val==='string'&&val){
        if(el.children.length>0){var html=val;Array.from(el.children).forEach(function(c){html=html.replace(c.textContent,c.outerHTML)});el.innerHTML=html}
        else el.textContent=val;
      }
    });
  }
  
  function applyShopI18n(s){
    if(!s) return;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key=el.getAttribute('data-i18n'),parts=key.split('.'),val=s;
      // Skip keys handled by applyLanding (credontoken, wallet, etc.)
      if(parts[0]==='credontoken'||parts[0]==='wallet'||parts[0]==='landing')return;
      if(parts[0]==='nav'&&(parts[1]==='shop'||parts[1]==='home'||parts[1]==='signIn'))return;
      for(var i=0;i<parts.length;i++){if(!val)break;val=val[parts[i]]}
      // If locale is missing this key, fall back to English original
      if(typeof val!=='string'||!val){
        if(EN_SHOP){val=EN_SHOP;for(var j=0;j<parts.length;j++){if(!val)break;val=val[parts[j]]}}
        if(typeof val!=='string'||!val){val=el.getAttribute('data-original')||el.textContent.trim()}
      }
      if(typeof val==='string'&&val){
        el.textContent=val;
      }
    });
  }
  
  function applyShop(s){
    if(!s) return;
    // Type filters
    document.querySelectorAll('.tf').forEach(function(el){
      var orig=el.getAttribute('data-original')||el.textContent.trim().replace(/[🛍📰🔨📋⟳\uFE0F\s]/g,'');
      if(!el.getAttribute('data-original'))el.setAttribute('data-original',orig);
      var f=s.filters;if(!f)return;
      if(orig==='All')el.textContent=f.all||'All';
      else if(orig==='Mall')el.textContent='🛍️ '+(f.mall||'Mall');
      else if(orig==='Classifieds')el.textContent='📰 '+(f.classifieds||'Classifieds');
      else if(orig==='Auctions')el.textContent='🔨 '+(f.auctions||'Auctions');
      else if(orig==='Wanted')el.textContent='📋 '+(f.wanted||'Wanted');
    });
    // h1 with data-i18n
    // h1 translation handled by translateCommonStrings below
    // search placeholder
    var sb=document.getElementById('searchBox');if(sb&&s.header&&s.header.searchPlaceholder)sb.placeholder=s.header.searchPlaceholder;
  }
  
  // Translate common UI strings by matching text content
  function translateCommonStrings(landing,shop){console.log('i18n: translateCommonStrings called, nav a='+document.querySelectorAll('nav a').length);
    var nav=landing?landing.nav:{},snav=shop?shop.nav:{},cat=shop?shop.categories:{},filt=shop?shop.filters:{},slist=shop?shop.listing:{},sft=shop?shop.footer:{},shead=shop?shop.header:{};
    
    // Merge nav from both locale sets
    var n={};
    for(var k in nav)n[k]=nav[k];
    for(var k in snav)n[k]=snav[k];
    
    // Translate nav links using data-original for reliable matching
    document.querySelectorAll('nav a').forEach(function(a){
      var orig=a.getAttribute('data-original')||'';
      // Strip emoji/arrows for matching but preserve in data-original
      var clean=orig.replace(/[←🛒🏠💱➕💬📊📋📈🔬📢⚖️🏪🎨📨📦🛍👥🤝]/g,'').trim();
      if(!orig){clean=a.textContent.trim().replace(/[←🛒🏠💱➕💬📊📋📈🔬📢⚖️🏪🎨📨📦🛍👥🤝]/g,'').trim();a.setAttribute('data-original',clean);orig=clean;}
      // Use merged nav with fallback to English
      var txt='';
      if(clean==='Browse'||clean==='Shop')txt=n.shop||nav.shop||'Shop';
      else if(clean==='Credon'||clean==='Wallet')txt='💱 '+(n.credon||nav.credon||'Credon');
      else if(clean==='Home')txt='🏠 '+(n.home||nav.home||'Home');
      else if(clean==='Post'||clean.includes('Post')||clean==='Create')txt=n.create||'+ Post';
      else if(clean==='Cart')txt=n.cart||'🛒';
      else if(clean==='Dashboard'||clean.includes('Dashboard'))txt=n.dashboard||snav.dashboard||'Dashboard';
      else if(clean==='Settings')txt=n.settings||snav.settings||'Settings';
      if(txt)a.textContent=txt;
    });
    
    // Translate all h1 without data-i18n
    document.querySelectorAll('h1:not([data-i18n])').forEach(function(h1){
      var txt=h1.textContent.trim().replace(/^[^\w\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0400-\u04FF]+/,'');
      var map={
        'Dashboard':'','Overview':'','Settings':'','Orders':'','Analytics':'',
        'Messages':shead.allListings||'','Profile':'','Wishlist':'','Cart':'',
        'Offers':'','Promotions':'','Disputes':'','Help Center':'','Contact Us':'',
        'Terms':'','Privacy':'','Affiliate Program':'',
        'My Purchases':shead.allListings||'','Saved Searches':'','Gift Cards':'',
        'Pricing':shead.allListings||'','Checkout':shead.allListings||'',
        'Following':'','Bulk Import':shead.allListings||''
      };
      // Latin-only text means it's still English - don't touch non-Latin
      if(/^[A-Za-z\s🎨📊📋📈🔬📢⚖️🏪📨📦🛍💬🔍📁📥⚙️👤🤝⭐📋💰📁]{1,50}$/.test(txt)){
        // Try to find matching category or filter key
        var slug=txt.toLowerCase().replace(/\s+/g,'');
        if(sft&&sft[slug])h1.textContent=sft[slug];
        // Keep original if no match found
      }
    });
    
    // Translate common button text
    document.querySelectorAll('button,.btn-sm,a.btn').forEach(function(el){
      var txt=el.textContent.trim().replace(/\s+/g,' ');
      if(slist){
        if(txt==='Add')el.textContent=slist.addToCart||'Add';
        else if(txt==='Offer')el.textContent=slist.offer||'Offer';
        else if(txt==='Bid')el.textContent=slist.bid||'Bid';  
        else if(txt==='Buy Now')el.textContent=slist.buyNow||'Buy Now';
        else if(txt==='View')el.textContent=slist.viewDetails||'View';
      }
      // Sign Out button
      if(txt==='Sign Out'&&nav&&nav.signOut)el.textContent=nav.signOut;
    });
    
    // Translate labels with "label" class and stats
    document.querySelectorAll('.muted').forEach(function(el){
      var orig=el.getAttribute('data-original');
      if(!orig&&el.textContent.trim()){
        orig=el.textContent.trim();
        if(orig.length<40)el.setAttribute('data-original',orig);
      }
      if(orig==='Total Invited'){if(snav&&snav.totalInvited)el.textContent=snav.totalInvited}
      else if(orig==='Credon Earned'){if(snav&&snav.credonEarned)el.textContent=snav.credonEarned}
      else if(nav&&orig==='Sign Out')el.textContent=nav.signOut;
    });
    
    // Translate sidebar links
    document.querySelectorAll('.sidebar a').forEach(function(el){
      var txt=el.textContent.trim();
      if(nav&&txt==='Sign In'&&nav.signIn)el.textContent=nav.signIn;
      if(nav&&txt==='Register'&&nav.register)el.textContent=nav.register;
    });
    
    // Translate h1 elements with data-i18n using shop locale
    document.querySelectorAll('h1[data-i18n]').forEach(function(h1){
      var key=h1.getAttribute('data-i18n'),parts=key.split('.'),val=shop;
      for(var i=0;i<parts.length;i++){if(!val)break;val=val[parts[i]]}
      if(typeof val==='string'&&val)h1.textContent=val;
    });
    
    // Mirror translated h1 to nav-brand
    var h1i18n=document.querySelector('h1[data-i18n]');
    if(h1i18n){
      document.querySelectorAll('.nav-brand').forEach(function(nb){
        nb.textContent=h1i18n.textContent;
      });
    }
    
    // Translate footer links
    if(sft){
      document.querySelectorAll('footer a').forEach(function(el,i){
        var keys=['browse','create','wallet','help','terms','privacy','contact','affiliate'];
        if(sft[keys[i]])el.textContent=sft[keys[i]];
      });
    }
  }
  
  // Apply on load
  document.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){
      injectLangSelector();
      // Update hardcoded selectors
      document.querySelectorAll('select[id="langSelect"], select[id="langSel"]').forEach(function(s){s.value=currentLang});
      if(currentLang!=='en'){
        document.documentElement.lang=currentLang;
        document.documentElement.dir=['ar','fa','ur'].includes(currentLang)?'rtl':'ltr';
        loadAndApply(currentLang);
      }
    },200);
  });
  
  // Re-apply after auth.js modifies nav (fires after all scripts)
  setTimeout(function(){
    if(currentLang!=='en'){
      document.documentElement.lang=currentLang;
      document.documentElement.dir=['ar','fa','ur'].includes(currentLang)?'rtl':'ltr';
      loadAndApply(currentLang);
    }
  },800);

  // Watch for dynamic content changes and re-translate
  var i18nObserver = new MutationObserver(function(mutations) {
    var hasNewNodes = mutations.some(function(m) { return m.addedNodes.length > 0; });
    if (hasNewNodes && currentLang !== 'en') {
      loadAndApply(currentLang);
    }
  });
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      i18nObserver.observe(document.body, { childList: true, subtree: true });
    }, 1000);
  });

})();
