#!/bin/bash
set -e
VPS="bryan@216.250.112.73"
REMOTE="/var/www/heavenslive/frontend-shop/build"
LOCAL="/home/bryan/.openclaw/workspace/heavenslive/var/www/heavenslive/frontend-shop/build"

echo "📦 Syncing cart.html..."
scp "$LOCAL/cart.html" "$VPS:$REMOTE/"

echo "📦 Syncing listing/detail.html..."
scp "$LOCAL/listing/detail.html" "$VPS:$REMOTE/"

echo "🚀 Restarting server..."
ssh "$VPS" "pm2 restart heavenslive-api"

echo "✅ Done — test at https://heavenslive.com/shop/cart"
