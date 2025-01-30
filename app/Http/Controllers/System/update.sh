#!/bin/bash
set -e
echo "🚀 Starting deployment..."

# Reset all local changes
echo "🔄 Resetting local changes..."
git reset --hard HEAD

# Pull the latest changes from the repository
git pull origin main --force

# Git operations

git pull origin main

# Dependencies
composer install --no-dev --optimize-autoloader

echo "🛠 Building assets... using NODE.JS FOR REACT CLIENT FRONTEND"
#/root/.nvm/versions/node/v23.1.0/bin/npm install
#/root/.nvm/versions/node/v23.1.0/bin/npm run build

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