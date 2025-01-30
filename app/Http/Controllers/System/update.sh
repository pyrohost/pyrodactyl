#!/bin/bash

# Error handling
set -e

# Store password
PASSWORD="Asuna#2024~S4O!"

# Function to run sudo with password
run_sudo() {
    echo $PASSWORD | sudo -S $@
}

echo "🚀 Starting system update..."

# Authenticate sudo
echo $PASSWORD | sudo -S echo "Authentication successful"

# Git operations
run_sudo git pull origin main

# Dependencies
run_sudo composer install --no-dev --optimize-autoloader

echo "🛠 Building assets... using NODE.JS FOR REACT CLIENT FRONTEND"

# NVM and Node operations
run_sudo bash -c "
source /root/.nvm/nvm.sh
nvm use 22
npm install
npm run build
"

# Laravel updates
run_sudo php artisan down
run_sudo php artisan config:cache
run_sudo php artisan route:cache
run_sudo php artisan view:cache
run_sudo php artisan migrate --force
run_sudo php artisan up

# Extra commands if provided
if [ ! -z "$1" ]; then
    run_sudo eval "$1"
fi

echo "✅ Update completed successfully!"