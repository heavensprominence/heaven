#!/bin/bash
# ============================================================
# HeavensLive Asset Deployment Script
# Ensures ALL static assets are present on the VPS.
# Safe to run repeatedly. Logs every sync.
# Run from local:  bash deploy-assets.sh
# Run from VPS:    bash deploy-assets.sh --from-vps
# ============================================================
set -euo pipefail

VPS_HOST="bryan@216.250.112.73"
VPS_ROOT="/var/www/heavenslive"
LOCAL_REPO="${HOME}/.openclaw/workspace/heavenslive/var/www/heavenslive"
LOG_FILE="/tmp/heavenslive-deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log()  { echo "[${TIMESTAMP}] $*" | tee -a "$LOG_FILE"; }
warn() { echo "[${TIMESTAMP}] WARN: $*" | tee -a "$LOG_FILE"; }
die()  { echo "[${TIMESTAMP}] FATAL: $*" | tee -a "$LOG_FILE"; exit 1; }

# ── Local → VPS sync ──────────────────────────────────────
sync_to_vps() {
    local src="$1"
    local dest="$2"
    local label="$3"

    if [ ! -d "$src" ] && [ ! -f "$src" ]; then
        warn "$label: local path missing — $src"
        return 1
    fi

    log "Syncing $label …"
    rsync -avz --checksum \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='uploads/listings' \
        --exclude='*.log' \
        "$src" "$VPS_HOST:$dest" 2>&1 | tail -3 | tee -a "$LOG_FILE"

    log "✓ $label synced"
}

# ── Verification checks ────────────────────────────────────
verify_on_vps() {
    local path="$1"
    local label="$2"

    ssh "$VPS_HOST" "test -e $path" 2>/dev/null && {
        log "  ✓ $label present"
    } || {
        warn "  ✗ $label MISSING on VPS: $path"
    }
}

# ── Main ───────────────────────────────────────────────────
echo "" >> "$LOG_FILE"
log "=========================================="
log "HeavensLive Asset Deploy — $TIMESTAMP"
log "=========================================="

# 1. Full public/ directory sync
sync_to_vps \
    "$LOCAL_REPO/public/" \
    "$VPS_ROOT/public/" \
    "public/"

# 2. Frontend React build static assets
sync_to_vps \
    "$LOCAL_REPO/frontend/build/static/" \
    "$VPS_ROOT/frontend/build/static/" \
    "frontend/build/static/"

# 3. Frontend-shop build
sync_to_vps \
    "$LOCAL_REPO/frontend-shop/build/" \
    "$VPS_ROOT/frontend-shop/build/" \
    "frontend-shop/build/"

# 4. Backend source (in case locale files or services changed)
sync_to_vps \
    "$LOCAL_REPO/backend/src/" \
    "$VPS_ROOT/backend/src/" \
    "backend/src/"

# 5. Locale files (critical — 17 languages × 3 locale types)
sync_to_vps \
    "$LOCAL_REPO/public/locales/" \
    "$VPS_ROOT/public/locales/" \
    "public/locales/"

# ── Critical file verification ─────────────────────────────
log ""
log "Verifying critical assets …"

verify_on_vps "$VPS_ROOT/public/credon/faq.html" "FAQ page"
verify_on_vps "$VPS_ROOT/public/credon/ledger.html" "Ledger page"
verify_on_vps "$VPS_ROOT/public/credon/wallet.html" "Wallet page"
verify_on_vps "$VPS_ROOT/public/credon/index.html" "Credon index"
verify_on_vps "$VPS_ROOT/public/index.html" "Landing page"
verify_on_vps "$VPS_ROOT/public/currency-catalog.html" "Currency catalog"
verify_on_vps "$VPS_ROOT/public/sitemap.xml" "Sitemap"
verify_on_vps "$VPS_ROOT/public/llms.txt" "llms.txt"
verify_on_vps "$VPS_ROOT/public/shop.md" "shop.md"
verify_on_vps "$VPS_ROOT/public/credon.md" "credon.md"
verify_on_vps "$VPS_ROOT/frontend/build/static/media/audio.d525093d0a0cfdd98120.wav" "Prayer audio"

# Verify currency SVGs
CURRENCY_COUNT=$(ssh "$VPS_HOST" "ls $VPS_ROOT/public/currency/*.svg 2>/dev/null | wc -l" 2>/dev/null || echo "0")
if [ "$CURRENCY_COUNT" -ge 700 ]; then
    log "  ✓ Currency SVGs: $CURRENCY_COUNT files"
else
    warn "  ✗ Currency SVGs: only $CURRENCY_COUNT files (expected 700+)"
fi

# Verify locale files
LOCALE_COUNT=$(ssh "$VPS_HOST" "ls $VPS_ROOT/public/locales/*.json 2>/dev/null | wc -l" 2>/dev/null || echo "0")
if [ "$LOCALE_COUNT" -ge 45 ]; then
    log "  ✓ Locale files: $LOCALE_COUNT"
else
    warn "  ✗ Locale files: only $LOCALE_COUNT (expected 45+)"
fi

# ── Optional: restart the API ──────────────────────────────
if [ "${1:-}" = "--restart" ] || [ "${1:-}" = "-r" ]; then
    log ""
    log "Restarting heavenslive-api …"
    ssh "$VPS_HOST" "pm2 restart heavenslive-api" 2>&1 | tee -a "$LOG_FILE"
    log "✓ API restarted"
fi

# ── Summary ────────────────────────────────────────────────
log ""
log "=========================================="
log "Deploy complete — $(date '+%H:%M:%S')"
log "Log: $LOG_FILE"
log "=========================================="
