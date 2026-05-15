#!/bin/bash
# HeavensLive VPS Fix — run as: bash fix.sh

echo "=== 1. Fix nginx shop subdomain ==="
sudo tee /etc/nginx/sites-available/shop << 'EOF'
server {
    listen 80;
    server_name shop.heavenslive.com;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    server_name shop.heavenslive.com;
    ssl_certificate /etc/letsencrypt/live/heavenslive.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/heavenslive.com-0001/privkey.pem;
    client_max_body_size 20M;
    root /var/www/heavenslive/frontend-shop/build;
    index index.html;
    location ^~ /uploads/ {
        alias /var/www/heavenslive/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location /api/ {
        client_max_body_size 20M;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

echo "=== 2. Fix nginx credon subdomain ==="
sudo tee /etc/nginx/sites-available/credon << 'EOF'
server {
    listen 80;
    server_name credon.heavenslive.com;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    server_name credon.heavenslive.com;
    ssl_certificate /etc/letsencrypt/live/heavenslive.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/heavenslive.com/privkey.pem;
    client_max_body_size 20M;
    root /var/www/heavenslive/public;
    index index.html;
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /uploads/ {
        alias /var/www/heavenslive/public/uploads/;
        expires 30d;
    }
    location / {
        try_files $uri $uri/ /credon/index.html;
    }
}
EOF

echo "=== 3. Reload nginx ==="
sudo nginx -t && sudo systemctl reload nginx

echo "=== 4. Restart app ==="
pm2 restart heavenslive-api

echo "=== 5. Check ==="
curl -so /dev/null -w "%{http_code}" https://heavenslive.com/shop/ && echo " shop OK"
curl -so /dev/null -w "%{http_code}" https://heavenslive.com/credon/ && echo " credon OK"
curl -so /dev/null -w "%{http_code}" https://heavenslive.com/ && echo " landing OK"

echo "=== Done ==="
