#!/bin/ash -e
cd /app

# Directory and log setup
mkdir -p /var/log/panel/logs/ /var/log/supervisord/ /var/log/nginx/ /var/log/php7/ \
  && chmod 777 /var/log/panel/logs/ \
  && ln -s /app/storage/logs/ /var/log/panel/

# Check mounted /app/var directory
if [ ! -d /app/var ]; then
  echo "You must mount the /app/var directory to the container."
  exit 1
fi

# .env file handling
if [ ! -f /app/var/.env ]; then
  echo "Creating .env file."
  touch /app/var/.env
fi

rm -f /app/.env
ln -s /app/var/.env /app/

# Environment configuration
(
    source /app/.env
    
    if [ -z "$APP_KEY" ]; then
        echo "Generating APP_KEY"
        echo "APP_KEY=" >> /app/.env
        APP_ENVIRONMENT_ONLY=true php artisan key:generate
    fi

    if [ -z "$HASHIDS_LENGTH" ]; then
        echo "Defaulting HASHIDS_LENGTH to 8"
        echo "HASHIDS_LENGTH=8" >> /app/.env
    fi

    if [ -z "$HASHIDS_SALT" ]; then
        echo "Generating HASHIDS_SALT"
        HASHIDS_SALT=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 20 | head -n 1)
        echo "HASHIDS_SALT=$HASHIDS_SALT" >> /app/.env
    fi
)

# SSL configuration
echo "Checking if https is required."
if [ -f /etc/nginx/http.d/panel.conf ]; then
  echo "Using nginx config already in place."
  if [ $LE_EMAIL ]; then
    echo "Checking for cert update"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  fi
else
  if [ -z $LE_EMAIL ]; then
    echo "Using http config."
    cp .github/docker/default.conf /etc/nginx/http.d/panel.conf
  else
    echo "Configuring SSL"
    cp .github/docker/default_ssl.conf /etc/nginx/http.d/panel.conf
    sed -i "s|<domain>|$(echo $APP_URL | sed 's~http[s]*://~~g')|g" /etc/nginx/http.d/panel.conf
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  fi
  rm -rf /etc/nginx/http.d/default.conf
fi

# Database configuration
if [[ -z $DB_PORT ]]; then
  DB_PORT=3306
  echo "DB_PORT not specified, defaulting to 3306"
fi

# Wait for database
echo "Checking database status."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "Waiting for database connection..."
  sleep 1
done

# Database migration with seeding protection
echo "Checking database migrations."
if ! php artisan migrate:status | grep -q "No migrations found"; then
  # Only run migrations if needed
  php artisan migrate --force
  
  # Check if we need to seed (only if migrations ran)
  if php artisan migrate:status | grep -q "Ran"; then
    echo "Running database seed if needed."
    php artisan db:seed --force
  fi
fi

# Start services
echo "Starting cron jobs."
crond -L /var/log/crond -l 5

echo "Starting supervisord."
exec "$@"
