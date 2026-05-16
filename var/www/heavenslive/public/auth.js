// HeavensLive Auth Helper — checks localStorage for JWT token
// Add <script src="/auth.js"></script> to any page
(function(){
  function checkAuth() {
  var token = localStorage.getItem('token');
  if (!token) return;
  try {
    // JWT uses base64url (not standard base64) — fix encoding
    var base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    var payload = JSON.parse(atob(base64));
    if (!payload.email) return;
    var username = payload.email.split('@')[0];
    
    // Find nav-links containers and update them (skip nav-actions on shop pages)
    var containers = document.querySelectorAll('.nav-links');
    containers.forEach(function(nav){
      if (nav) {
        nav.innerHTML = '<a href="/shop/" data-i18n="nav.shop">Shop</a>' +
          '<a href="/credon/wallet">💱 Credon</a>' +
          '<a href="/" data-i18n="nav.home">Home</a>' +
          '<span style="color:#A0A0B0;font-size:0.85rem;margin:0 8px">👤 ' + username + '</span>' +
          '<button onclick="localStorage.clear();location.href=\'/credon/\'" style="background:transparent;border:1px solid #C8A951;color:#C8A951;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.85rem" data-i18n="nav.signOut">Sign Out</button>';
      }
    });
  } catch(e) {}
  }

// Auto-refresh token 5 min before expiry
setInterval(async function(){
  var token = localStorage.getItem('token');
  if(!token) return;
  try {
    var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    var expMs = payload.exp * 1000;
    var now = Date.now();
    if(expMs - now < 300000) { // Less than 5 min left
      var resp = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
      });
      if(resp.ok) {
        var data = await resp.json();
        if(data.token) localStorage.setItem('token', data.token);
      }
    }
  } catch(e) {}
}, 60000); // Check every minute

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
