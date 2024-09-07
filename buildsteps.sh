#!/bin/bash

mysqlrootpass="pyro"

#? All Mysql commands have to be run as root in the NixOS Environment
# Create the database for the panel
sudo mysql -u root -p$mysqlrootpass -e "CREATE DATABASE IF NOT EXISTS panel;" \
    -e "CREATE USER 'pyrodactyl'@'%' IDENTIFIED BY 'password';" \
    -e "GRANT ALL PRIVILEGES ON panel.% TO 'pyrodactyl'@'%' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Create the database host user
sudo mysql -u root -p$mysqlrootpass -e "CREATE USER IF NOT EXISTS 'pyrodactyluser'@'%' IDENTIFIED BY 'pyrodactyl';" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'pyrodactyluser'@'%' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Initialize the Pterodactyl panel

# This cp command breaks my configuration, that is why it's commented
# cp .env.example .env
php /usr/local/bin/composer install --no-dev --optimize-autoloader

# PHP Artisan commands
php artisan key:generate --force
php artisan p:environment:setup -n --author dev@pyro.host --url http://localhost:3000 --cache redis --session redis --queue redis
php artisan p:environment:database -n --host 127.0.0.1 --port 3306 --database panel --username pyrodactyluser --password pyrodactyl
php artisan migrate --seed --force

# Create a developer user
# Adding --admin tag just in case it ever gets fixed
php artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password password --admin
# --admin probably won't be fixed due to security concerns
sudo mysql -u root -p$mysqlrootpass -e "USE panel; UPDATE users SET root_admin = 1;" # workaround because --admin is broken

# Make a location and node for the panel
php artisan p:location:make -n --short local --long Local
php artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn localhost --public 1 --scheme http --proxy 0 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0

# Add some dummy allocations to the node
sudo mysql -u root -p$mysqlrootpass -e "USE panel; INSERT INTO allocations (node_id, ip, port) VALUES (1, 'localhost', 25565), (1, 'localhost', 25566), (1, 'localhost', 25567);"

# Setup wings
#curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
#chmod u+x /usr/local/bin/wings

# Configure wings
# This needs to be changed into a docker-compose file probably, or just a docker cli command
mkdir $(pwd)/nix/pterodactyl
mkdir $(pwd)/nix/pterodactyl/etc
mkdir $(pwd)/nix/pterodactyl/var
mkdir $(pwd)/nix/pterodactyl/tmp

php artisan p:node:configuration 1 >$(pwd)/nix/pterodactyl/etc/config.yml

docker run -d \
  --name pterodactyl-wings \
  --rm \
  --restart always \
  --network wings \
  -p 8080:8080 \
  -p 2022:2022 \
  -e TZ="America/Los_Angeles" \
  -e WINGS_UID=1001 \
  -e WINGS_GID=1001 \
  -e WINGS_USERNAME=pyrodactyl \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -v "/var/lib/docker/containers:/var/lib/docker/containers" \
  -v "$(pwd)/nix/pterodactyl/etc:/etc/pterodactyl" \
  -v "$(pwd)/nix/pterodactyl/lib:/var/lib/pterodactyl" \
  -v "$(pwd)/nix/pterodactyl/log:/var/log/pterodactyl" \
  -v "$(pwd)/nix/pterodactyl/tmp:/tmp/pterodactyl" \
  --rm
  ghcr.io/pterodactyl/wings:latest
