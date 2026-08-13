# HeavensLive — Project Guide

A divinely-underwritten global marketplace + digital currency (Credon) platform.
Production: https://heavenslive.com

## What this repo is

| Area | Path | Notes |
|---|---|---|
| Backend (Node/Express) | `var/www/heavenslive/backend/` | Port 5000, PostgreSQL, PM2 process `heavenslive-api` |
| Backend source | `backend/src/` | `index.js`, `routes/`, `services/`, `models/`, `middleware/`, `scripts/` |
| Credon React SPA | `var/www/heavenslive/frontend/` | Source + `build/` output |
| Shop React app | `var/www/heavenslive/frontend-shop/` | Source + `build/` output |
| Static pages | `var/www/heavenslive/public/` | Landing, credon pages, locales, uploads, sitemap |
| Mobile (Flutter) | `mobile/` | Android/iOS |
| Desktop (Tauri v2) | `desktop/` | Linux/Windows/macOS |
| E2E tests (Playwright) | `tests/` | 6 specs, ~38 tests |
| DB schema | `backend/database/schema.sql` + `backend/src/migrations/` | Live DB is the source of truth |

## Serving map (production)

- `/` landing → nginx serves `public/index.html` directly
- `/shop/*` → Express serves `frontend-shop/build/*.html`
- `/credon/*` → Express serves `public/credon/*.html` (static pages; the React SPA is legacy)
- `/api/*` → Express API (JWT auth: `Authorization: Bearer <token>`)
- `/downloads/` → nginx (desktop/mobile installers)
- `/uploads/` → user-uploaded listing/store images

## Environment & secrets

- Config lives in `backend/.env` (gitignored). Template: `backend/.env.example`.
- Secrets must NEVER be committed. If you need a token, read it from `.env` or the workspace `.secrets/` dir.
- Node 26 native modules (e.g. `sharp`) may need a rebuild from source — install `libvips` + `node-gyp`.

## Deploy

- Full sync to VPS: `smooth-sync.sh`
- Targeted fixes: `scp` + `pm2 restart heavenslive-api` on the VPS (`bryan@216.250.112.73`)
- Locale files: **VPS is the source of truth** — `smooth-sync.sh` excludes `locales/` so translations are not overwritten.
- Backups: nightly 3 AM via `backend/src/services/backupService.js`.

## Testing

```bash
cd heavenslive && npm test            # chromium project only
npm run test:mobile                   # Pixel 5 project
npm run test:all                      # both projects
```

⚠️ `playwright.config.js` points at `https://heavenslive.com` (production). Do NOT run mutating specs against prod casually — see known issues.

## Key conventions / gotchas

- Auth header must be `Bearer <token>` (a `*** ` placeholder has been a recurring bug).
- `i18n.js` loads `landing-*`, `shop-*`, AND base locale files; `applyShopI18n` must not overwrite `applyLanding` translations.
- Category tree: "Other" subcategories always sort last (sort_order 9999).
- Currency: listings have `currency` + `accepted_currencies`; PayPal converts via Frankfurter with static fallback.
- Platform fees: Credon 7%, fiat/crypto 9% (configurable in admin).
- Express 5 `send` is broken for Range requests — use the custom stream handler for media.

## DB schema (canonical)

- Base schema: `backend/database/schema.sql` (Credon tables).
- Migrations: `backend/src/migrations/*.sql` (run in order).
- The **live DB is authoritative**. Full-dump snapshots are generated on demand via `pg_dump`, never hand-edited or committed.

## Out of scope here

- The Jcode multi-agent registry previously at this path was moved to `~/openclaw/workspace/jcode/AGENTS.md`.
