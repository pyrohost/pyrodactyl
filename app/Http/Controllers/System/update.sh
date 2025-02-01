#!/bin/bash

# Error handling
set -e

# Environment variables
export DEBIAN_FRONTEND=noninteractive
PASSWORD="Asuna#2024~S4O!"

# Helper function for sudo commands
run_sudo() {
    echo "$PASSWORD" | sudo -S -u root "$@"
}

# Ensure script is run as www-data
if [ "$(whoami)" != "www-data" ]; then
    echo "Script must be run as www-data"
    exit 1
fi

echo "🚀 Starting system update... New"

# Initial authentication
echo "$PASSWORD" | sudo -S echo "Authentication successful"

# Git operations with error handling
run_sudo bash -c "
cd /var/www/pterodactyl
git stash save 'Pre-update stash' || true # Stash local changes (skip error if no changes)
git pull origin main || {
    echo 'Git pull failed'
    exit 1
}
git stash || true # Pop stashed changes after pulling
" || {
    echo "Git operations failed"
    exit 1
}

# Dependencies
run_sudo composer install --no-dev --optimize-autoloader || {
    echo "Composer install failed"
    exit 1
}

echo "🛠 Building assets... using NODE.JS FOR REACT CLIENT FRONTEND"

# NVM and Node operations
run_sudo bash -c "
source /root/.nvm/nvm.sh
nvm use 22
npm install
npm run build
" || {
    echo "Node.js build failed"
    exit 1
}

# Laravel updates
run_sudo php artisan down
#run_sudo php artisan config:cache
#run_sudo php artisan route:cache
#run_sudo php artisan view:cache
run_sudo php artisan migrate --force
run_sudo php artisan up
run_sudo php artisan queue:restart
run_sudo chown -R www-data:www-data /var/www/pterodactyl/*
echo "✅ Update completed successfully!"
