#!/bin/bash

mysqlrootpass="password"
mysqluser="root"

CONTAINER_NAME="mariadb"


docker-compose --project-directory ./nix/docker/maria/ up -d --force-recreate

until [ "$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME)" == "healthy" ]; do
    echo "Waiting for MariaDB container to be healthy..."
    sleep 5
done

echo "MariaDB container is healthy. Proceeding with the script."

# Create the database for the panel
mysql -u "$mysqluser" -p"$mysqlrootpass" -h 127.0.0.1 -e "
    CREATE DATABASE IF NOT EXISTS panel;
    CREATE USER IF NOT EXISTS 'pyrodactyl'@'%' IDENTIFIED BY 'password';
    GRANT ALL PRIVILEGES ON panel.* TO 'pyrodactyl'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
"


# Create the database host user
mysql -u "$mysqluser" -p"$mysqlrootpass" -h 127.0.0.1 -e "
    CREATE USER IF NOT EXISTS 'pyrodactyluser'@'%' IDENTIFIED BY 'pyrodactyl';
    GRANT ALL PRIVILEGES ON panel.* TO 'pyrodactyluser'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
"

# Initialize the Pterodactyl panel

# This cp command breaks my configuration, that is why it's commented
# cp .env.example .env
composer install --no-dev --optimize-autoloader

# PHP Artisan commands
php artisan key:generate --force
php artisan p:environment:setup -n --author dev@pyro.host --url http://localhost:8000 --cache redis --session redis --queue redis
php artisan p:environment:database -n --host 127.0.0.1 --port 3306 --database panel --username pyrodactyluser --password pyrodactyl
php artisan migrate --seed --force

# Create a developer user
# Adding --admin tag just in case it ever gets fixed
php artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password password --admin
# --admin probably won't be fixed due to security concerns
mysql -u $mysqluser -p$mysqlrootpass -h 0.0.0.0 -e "USE panel; UPDATE users SET root_admin = 1;" # workaround because --admin is broken

# Make a location and node for the panel
php artisan p:location:make -n --short local --long Local
php artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn localhost --public 1 --scheme http --proxy 0 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0

# Add some dummy allocations to the node
mysql -u $mysqluser -p$mysqlrootpass -h 0.0.0.0 -e "USE panel; UPDATE settings SET \`key\`='settings::recaptcha:enabled', value='false' WHERE id=1;"
# Disable Recaptcha

mysql -u $mysqluser -p$mysqlrootpass -h 0.0.0.0 -e "USE panel; UPDATE settings SET \`key\`='settings::recaptcha:enabled', value='false' WHERE id=1;"
# Setup wings
#curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
#chmod u+x /usr/local/bin/wings

# Delete Wings folders
rm -fR $(pwd)/nix/docker/wings/etc
rm -fR $(pwd)/nix/docker/wings/var
rm -fR $(pwd)/nix/docker/wings/tmp


# create Wings folders
mkdir $(pwd)/nix/docker/wings/etc
mkdir $(pwd)/nix/docker/wings/var
mkdir $(pwd)/nix/docker/wings/tmp


php artisan p:node:configuration 1 >$(pwd)/nix/docker/wings/etc/config.yml

docker-compose --project-directory ./nix/docker/wings up -d --force-recreate

php artisan serve


docker-compose --project-directory ./nix/docker/wings down
docker-compose --project-directory ./nix/docker/maria/ down

