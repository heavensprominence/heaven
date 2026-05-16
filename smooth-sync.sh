#!/bin/bash
# smooth-sync.sh — One command, perfect sync VPS ← local
set -e
VPS="bryan@216.250.112.73"
REMOTE="/var/www/heavenslive"
LOCAL="/home/bryan/.openclaw/workspace/heavenslive/var/www/heavenslive"

echo "🔐 Fixing permissions..."
ssh -t "$VPS" "sudo chown -R bryan:bryan $REMOTE/backend/src $REMOTE/public $REMOTE/frontend-shop/build 2>/dev/null; sudo mkdir -p $REMOTE/backend/public/uploads/listings $REMOTE/backend/public/uploads/stores; sudo chown -R bryan:bryan $REMOTE/backend/public" 2>/dev/null

echo "📦 Backend..."
rsync -avz --delete "$LOCAL/backend/src/" "$VPS:$REMOTE/backend/src/"

echo "🌐 Public..."
rsync -avz --delete "$LOCAL/public/" "$VPS:$REMOTE/public/"

echo "🛒 Shop..."
rsync -avz --delete "$LOCAL/frontend-shop/build/" "$VPS:$REMOTE/frontend-shop/build/"

# 🗄️ Categories sync skipped — VPS has live data
# (Uncomment below to force-sync shop_categories + category_translations)
# ssh "$VPS" "sudo -u postgres psql -d heavenslive_db -c 'DELETE FROM category_translations; DELETE FROM shop_categories;'" 2>/dev/null
# PGPASSWORD='***' pg_dump -U heavenslive -d heavenslive_db --data-only --table=shop_categories --table=category_translations > /tmp/sync-cats.sql 2>/dev/null
# scp /tmp/sync-cats.sql "$VPS:/tmp/"
# ssh "$VPS" "sudo -u postgres psql -d heavenslive_db -f /tmp/sync-cats.sql" 2>/dev/null

echo "🔧 Credon frontend..."
rsync -avz --delete "$LOCAL/frontend/build/" "$VPS:$REMOTE/frontend/build/"

echo "🚀 Restarting..."
ssh "$VPS" "pm2 restart heavenslive-api"
echo "✅ Done — https://heavenslive.com"
