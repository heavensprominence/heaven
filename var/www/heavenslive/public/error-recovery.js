/**
 * HeavensLive Error Recovery Module
 * Self-healing fetch wrapper with auto-retry, session recovery, and graceful degradation.
 * Drop-in replacement for fetch() with healing built in.
 */

(function() {
  'use strict';

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;
  const SESSION_CHECK_URL = '/api/auth/me';
  const LOGIN_URL = '/credon/';

  // ====== Core: Healing fetch() wrapper ======
  async function hlFetch(url, options = {}) {
    const retries = options._retries || 0;
    const retryOn = options.retryOn || [429, 500, 502, 503, 504];
    const timeout = options.timeout || 30000;
    
    delete options._retries;
    delete options.retryOn;
    delete options.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const fetchOptions = { ...options, signal: controller.signal };

    try {
      const resp = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle 401 — session expired
      if (resp.status === 401 && retries === 0) {
        const data = await resp.json().catch(() => ({}));
        if (data.error && /expired|invalid|token/i.test(data.error)) {
          handleSessionExpired();
          throw new HLSessionError('Session expired');
        }
      }

      // Handle transient server errors — retry with backoff
      if (retryOn.includes(resp.status) && retries < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, retries));
        return hlFetch(url, { ...options, _retries: retries + 1, retryOn, timeout });
      }

      // Handle 5xx / network errors from non-retryable
      if (resp.status >= 500) {
        console.warn('HL: Server error', resp.status, url);
      }

      return resp;
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof HLSessionError) throw err;
      
      // Network error — retry
      if (retries < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, retries));
        return hlFetch(url, { ...options, _retries: retries + 1, retryOn, timeout });
      }
      
      // All retries exhausted — graceful failure
      console.error('HL: Fetch failed after retries', url, err.message);
      throw new HLNetworkError('Unable to reach server after ' + MAX_RETRIES + ' attempts');
    }
  }

  // ====== Session recovery ======
  function handleSessionExpired() {
    console.warn('HL: Session expired, clearing token');
    localStorage.removeItem('token');
    hlBanner('Session expired. Please sign in again.', 'warning');
    // Redirect after short delay so user sees the message
    setTimeout(() => { window.location.href = LOGIN_URL; }, 2000);
  }

  // Check session health periodically
  async function checkSession() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const resp = await fetch(SESSION_CHECK_URL, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (resp.status === 401) {
        handleSessionExpired();
      }
    } catch(e) {
      // Network error during session check — ignore, not critical
    }
  }

  // ====== UI: Error boundary & banners ======
  function hlBanner(msg, type) {
    type = type || 'error';
    const existing = document.getElementById('hl-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.id = 'hl-banner';
    banner.style.cssText = [
      'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 20px;',
      'text-align:center;font-family:system-ui;font-size:.85rem;font-weight:600;',
      'animation:hlSlideDown .3s ease-out;cursor:pointer',
      type === 'warning' ? 'background:#C8A951;color:#0F0F1A' : 'background:#E74C3C;color:white'
    ].join('');
    banner.textContent = msg;
    banner.onclick = () => banner.remove();
    document.body.prepend(banner);
    
    // Auto-dismiss
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
  }

  // Generic error boundary for any page section
  function hlErrorBoundary(selector, fallbackHTML) {
    const el = document.querySelector(selector);
    if (!el) return;
    const original = el.innerHTML;
    return {
      show: () => { el.innerHTML = fallbackHTML || '<div style="text-align:center;padding:20px;color:#A0A0B0">Something went wrong. Please try again.</div>'; },
      restore: () => { el.innerHTML = original; },
      render: (html) => { el.innerHTML = html; }
    };
  }

  // ====== Helpers ======
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  class HLSessionError extends Error { constructor(msg) { super(msg); this.name = 'HLSessionError'; } }
  class HLNetworkError extends Error { constructor(msg) { super(msg); this.name = 'HLNetworkError'; } }

  // ====== Health check ======
  async function checkHealth() {
    try {
      const resp = await fetch('/api/health');
      return resp.ok;
    } catch(e) {
      return false;
    }
  }

  // ====== Export to window ======
  window.hlFetch = hlFetch;
  window.hlBanner = hlBanner;
  window.hlErrorBoundary = hlErrorBoundary;
  window.hlCheckSession = checkSession;
  window.hlCheckHealth = checkHealth;

  // ====== Auto-init ======
  // Add slide-down animation
  if (!document.getElementById('hl-styles')) {
    const style = document.createElement('style');
    style.id = 'hl-styles';
    style.textContent = '@keyframes hlSlideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  // Check session on load
  document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    // Re-check every 5 minutes
    setInterval(checkSession, 5 * 60 * 1000);
  });
})();
