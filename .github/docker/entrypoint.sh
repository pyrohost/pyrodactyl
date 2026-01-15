#!/bin/ash -e
cd /app

mkdir -p /var/log/panel/logs/ /var/log/supervisord/ /var/log/nginx/ /var/log/php7/ \
  && chmod 777 /var/log/panel/logs/ \
  && ln -s /app/storage/logs/ /var/log/panel/
# Ensure proper permissions for Laravel storage directories
mkdir -p /app/storage/logs /app/storage/framework/cache /app/storage/framework/sessions /app/storage/framework/views \
  && chmod -R 777 /app/storage/ \

chmod g+s /app/storage/logs/
chown nginx:nginx /app/storage/logs/

# Check that user has mounted the /app/var directory
if [ ! -d /app/var ]; then
  echo "You must mount the /app/var directory to the container."
  exit 1
fi

# Check the .env file exists and make a blank one if needed
if [ ! -f /app/var/.env ]; then
  echo "Creating .env file."
  touch /app/var/.env
fi

# Replace .env in container with our external .env file
rm -f /app/.env
ln -s /app/var/.env /app/

# Use a subshell to avoid polluting the global environment
(
    # Load in any existing environment variables in the .env file
    source /app/.env

    # Check if APP_KEY is set
    if [ -z "$APP_KEY" ]; then
        echo "Generating APP_KEY"
        echo "APP_KEY=" >> /app/.env
        APP_ENVIRONMENT_ONLY=true php artisan key:generate
    fi

    # Check if HASHIDS_LENGTH is set
    if [ -z "$HASHIDS_LENGTH" ]; then
        echo "Defaulting HASHIDS_LENGTH to 8"
        echo "HASHIDS_LENGTH=8" >> /app/.env
    fi


    # Check if HASHID_SALT is set
    if [ -z "$HASHIDS_SALT" ]; then
        echo "Generating HASHIDS_SALT"
        HASHIDS_SALT=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 20 | head -n 1)
        echo "HASHIDS_SALT=$HASHIDS_SALT" >> /app/.env
    fi
)

if [ -f /etc/nginx/http.d/panel.conf ]; then
  nginx -t
  if [[ $? -ne 0 ]]; then
    echo "nginx config test failed, regenerating"
    rm /etc/nginx/http.d/panel.conf
  fi

  if [[ $LE_EMAIL ]]; then
    grep "server_name $APP_URL" /etc/nginx/http.d/panel.conf
    if [[ $? -ne 0 ]]; then
      echo "APP_URL not found in nginx config, regenerating"
      rm /etc/nginx/http.d/panel.conf
    fi
  fi
fi

echo "Checking if https is required."
if [ -f /etc/nginx/http.d/panel.conf ]; then
  echo "Using nginx config already in place."
  if [ $LE_EMAIL ]; then
    echo "Checking for cert update"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  else
    echo "No letsencrypt email is set"
  fi
else
  echo "Checking if letsencrypt email is set."
  if [ -z $LE_EMAIL ]; then
    echo "No letsencrypt email is set using http config."
    cp .github/docker/default.conf /etc/nginx/http.d/panel.conf
  else
    echo "writing ssl config"
    cp .github/docker/default_ssl.conf /etc/nginx/http.d/panel.conf
    echo "updating ssl config for domain"
    sed -i "s|<domain>|$(echo $APP_URL | sed 's~http[s]*://~~g')|g" /etc/nginx/http.d/panel.conf
    echo "generating certs"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  fi
  echo "Removing the default nginx config"
  rm -rf /etc/nginx/http.d/default.conf
fi

if [[ -z $DB_PORT ]]; then
  echo -e "DB_PORT not specified, defaulting to 3306"
  DB_PORT=3306
fi

## check for DB up before starting the panel
echo "Checking database status."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "Waiting for database connection..."
  # wait for 1 seconds before check again
  sleep 1
done

## make sure the db is set up
echo -e "Migrating Database"
php artisan migrate --force

if [ "$SKIP_SEED" != "True" ]; then
  echo -e "Seeding database"
  php artisan migrate --seed --force
else
  echo -e "Skipping database seeding (SKIP_SEED=True)"
fi

# Setup development environment if specified
(
  source /app/.env

  if [ "$PYRODACTYL_DOCKER_DEV" = "true" ] && [ "$DEV_SETUP" != "true" ]; then
    echo -e "\e[42mDevelopment environment detected, setting up development resources...\e[0m"
    export POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD" docker-compose.yml | awk '{print $2}')
    export POSTGRES_USER=$(grep "POSTGRES_USER" docker-compose.yml | awk '{print $2}')

    php artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password dev
    # Create a developer user
    if [ "$DB_CONNECTION" = "mysql" ] || [ "$DB_CONNECTION" = "mariadb" ]; then
        mariadb -u root -h database -p"$DB_ROOT_PASSWORD" --ssl=0 -e "USE panel; UPDATE users SET root_admin = 1;"
    fi
    if [ "$DB_CONNECTION" = "pgsql" ]; then
        PGPASSWORD=$POSTGRES_PASSWORD psql -U$POSTGRES_USER  -dpanel -hpostgres -c"UPDATE users SET root_admin = 1;"
    fi
    # Make a location and node for the panel
    php artisan p:location:make -n --short local --long Local
    php artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn localhost --internal-fqdn $ELYTRA_INTERNAL_IP --public 1 --scheme http --proxy 0 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0 --daemonType elytra

    echo "Adding dummy allocations..."
    if [ "$DB_CONNECTION" = "mysql" ] || [ "$DB_CONNECTION" = "mariadb" ]; then
        mariadb -u root -h database -p"$DB_ROOT_PASSWORD" --ssl=0 -e "USE panel; INSERT INTO allocations (node_id, ip, port) VALUES (1, '0.0.0.0', 25565), (1, '0.0.0.0', 25566), (1, '0.0.0.0', 25567);"
    fi
    if [ "$DB_CONNECTION" = "pgsql" ]; then
        PGPASSWORD=$POSTGRES_PASSWORD psql -U$POSTGRES_USER  -dpanel -hpostgres -c"INSERT INTO allocations (node_id, ip, port) VALUES (1, '0.0.0.0', 25565), (1, '0.0.0.0', 25566), (1, '0.0.0.0', 25567);"

    fi

    echo "Creating database user..."
    if [ "$DB_CONNECTION" = "mysql" ] || [ "$DB_CONNECTION" = "mariadb" ]; then
        mariadb -u root -h database -p"$DB_ROOT_PASSWORD" --ssl=0 -e "CREATE USER 'pterodactyluser'@'%' IDENTIFIED BY 'somepassword'; GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'%' WITH GRANT OPTION;"
    fi
    if [ "$DB_CONNECTION" = "pgsql" ]; then
        PGPASSWORD=$POSTGRES_PASSWORD psql -U$POSTGRES_USER  -dpanel -hpostgres -c"CREATE USER pterodactyluser WITH PASSWORD 'somepassword' SUPERUSER;"
    fi

    # Configure node
    export ELYTRA_CONFIG=/etc/pterodactyl/config.yml
    mkdir -p $(dirname $ELYTRA_CONFIG)
    echo "Fetching and modifying Elytra configuration file..."
    CONFIG=$(php artisan p:node:configuration 1)

    # Allow all origins for CORS
    CONFIG=$(printf "%s\nallowed_origins: ['*']" "$CONFIG")

    # Update Elytra configuration paths if ELYTRA_DIR is set
    if [ -z "$ELYTRA_DIR" ]; then
      echo "ELYTRA_DIR is not set, using default paths."
    else
      echo "Updating ELYTRA configuration paths to '$ELYTRA_DIR'..."

      # add system section if it doesn't exist
      if ! echo "$CONFIG" | grep -q "^system:"; then
        CONFIG=$(printf "%s\nsystem:" "$CONFIG")
      fi

      update_config() {
        local key="$1"
        local value="$2"

        # update existing key or add new one
        if echo "$CONFIG" | grep -q "^  $key:"; then
          CONFIG=$(echo "$CONFIG" | sed "s|^  $key:.*|  $key: $value|")
        else
          CONFIG=$(echo "$CONFIG" | sed "/^system:/a\\  $key: $value")
        fi
      }

      update_config "root_directory" "$ELYTRA_DIR/srv/elytra/"
      update_config "log_directory" "$ELYTRA_DIR/srv/elytra/logs/"
      update_config "data" "$ELYTRA_DIR/srv/elytra/volumes"
      update_config "archive_directory" "$ELYTRA_DIR/srv/elytra/archives"
      update_config "backup_directory" "$ELYTRA_DIR/srv/elytra/backups"
      update_config "tmp_directory" "$ELYTRA_DIR/srv/elytra/tmp/"
    fi

    echo "Saving Elytra configuration file to '$ELYTRA_CONFIG'..."
    echo "$CONFIG" > $ELYTRA_CONFIG

    # Mark setup as complete
    echo "DEV_SETUP=true" >> /app/.env
    echo "Development setup complete."
  elif [ "$DEV_SETUP" = "true" ]; then
    echo "Skipping development setup, already completed."
  fi
)

## start cronjobs for the queue
echo -e "Starting cron jobs."
crond -L /var/log/crond -l 5

echo -e "Starting supervisord."
exec "$@"
