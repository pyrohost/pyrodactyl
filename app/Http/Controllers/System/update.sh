#!/bin/bash
set -e
echo "🚀 Starting deployment..."

# Git operations

git pull origin main

# Dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Laravel updates
php artisan down
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan up

# Extra commands if provided
if [ ! -z "$1" ]; then
    eval "$1"
fi

echo "✅ Deployment completed successfully!"