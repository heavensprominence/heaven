#!/bin/bash
# HeavensLive VPS Full Sync — run from lenovo
echo "Syncing all files to VPS..."

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/public/locales/ \
  bryan@216.250.112.73:/var/www/heavenslive/public/locales/

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/public/uploads/ \
  bryan@216.250.112.73:/var/www/heavenslive/public/uploads/

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/public/index.html \
  bryan@216.250.112.73:/var/www/heavenslive/public/

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/public/category-tree.js \
  bryan@216.250.112.73:/var/www/heavenslive/public/

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/public/i18n.js \
  bryan@216.250.112.73:/var/www/heavenslive/public/

rsync -avz --progress \
  /home/bryan/Documents/HeavensLive/var/www/heavenslive/frontend-shop/build/ \
  bryan@216.250.112.73:/var/www/heavenslive/frontend-shop/build/

echo ""
echo "Sync complete. Now SSH in and reload:"
echo "  ssh -t bryan@216.250.112.73 'sudo systemctl reload nginx'"
