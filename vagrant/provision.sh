#!/usr/bin/env bash
set -euo pipefail

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
warn() { echo -e "\n\033[1;33m!! $*\033[0m"; }
err() { echo -e "\n\033[1;31m!! $*\033[0m" >&2; }

export DEBIAN_FRONTEND=noninteractive

log Updating OS packages
apt-get update -y
apt-get upgrade -y

log Installing base utilities
apt-get install -y \
  ca-certificates curl gnupg lsb-release software-properties-common \
  git unzip zip jq wget ufw acl

log Configuring UFW
ufw --force reset || true
ufw --force enable
ufw allow ssh
ufw allow 3306/tcp
ufw allow 3000/tcp
ufw allow 8080/tcp
ufw allow 25500:25600/tcp
ufw allow 25500:25600/udp

log Installing Redis
apt-get install -y redis-server
systemctl enable --now redis-server

log Adding PHP 8.3 repository
add-apt-repository -y ppa:ondrej/php
apt-get update -y

log Installing PHP 8.3 + extensions
apt-get install -y \
  php8.3 php8.3-cli php8.3-fpm php8.3-gd php8.3-mysql php8.3-mbstring \
  php8.3-bcmath php8.3-xml php8.3-curl php8.3-zip php8.3-readline php8.3-redis

log Configuring PHP-FPM pool
cat >/etc/php/8.3/fpm/pool.d/pterodactyl.conf <<EOF
[pterodactyl]
user = vagrant
group = vagrant
listen = /run/php/pterodactyl.sock
listen.owner = vagrant
listen.group = vagrant
pm = ondemand
pm.max_children = 50
pm.process_idle_timeout = 10s
pm.max_requests = 500
chdir = /
EOF

systemctl enable --now php8.3-fpm

log Installing and configuring Nginx
apt-get install -y nginx
if grep -qE '^user\s+' /etc/nginx/nginx.conf; then
  sed -i 's/^user .*/user vagrant;/' /etc/nginx/nginx.conf
else
  sed -i '1i user vagrant;' /etc/nginx/nginx.conf
fi

cat >/etc/nginx/sites-available/pterodactyl.conf <<'EOF'
server {
    listen 3000;
    server_name localhost;
    root /var/www/pterodactyl/public;
    index index.php index.html;
    charset utf-8;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    access_log off;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;
    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_pass unix:/run/php/pterodactyl.sock;
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_connect_timeout 300;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
    }
    location ~ /\.ht { deny all; }
}
EOF

ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx

log Installing MariaDB
apt-get install -y mariadb-server mariadb-client

log Configuring MariaDB
cat >/etc/mysql/mariadb.conf.d/99-pterodactyl.cnf <<EOF
[mysqld]
bind-address = 0.0.0.0
port = 3306
max_connections = 1000
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
EOF

systemctl enable --now mariadb
systemctl restart mariadb

log Creating databases and users
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS panel;
CREATE USER IF NOT EXISTS 'pterodactyl'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'localhost' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'pterodactyluser'@'localhost' IDENTIFIED BY 'password';
CREATE USER IF NOT EXISTS 'pterodactyluser'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'%' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'dbhost'@'localhost' IDENTIFIED BY 'dbhostpassword';
CREATE USER IF NOT EXISTS 'dbhost'@'%' IDENTIFIED BY 'dbhostpassword';
GRANT ALL PRIVILEGES ON *.* TO 'dbhost'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'dbhost'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

log Installing Composer
if ! command -v composer >/dev/null 2>&1; then
  curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
  php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
fi

log Preparing /var/www/pterodactyl
chown -R vagrant:vagrant /var/www/pterodactyl
chmod -R u=rwX,g=rX,o=rX /var/www/pterodactyl

pushd /var/www/pterodactyl >/dev/null
[ -f .env ] || cp .env.example .env

log Composer install
sudo -u vagrant -H bash -lc 'cd /var/www/pterodactyl && composer install --no-dev --optimize-autoloader'
chmod -R 755 storage bootstrap/cache
setfacl -Rm u:vagrant:rwX storage bootstrap/cache >/dev/null 2>&1 || true
chown -R vagrant:vagrant storage bootstrap/cache

# helper (append --no-interaction automatically; avoid quoted, spaced values)
artisan() { sudo -u vagrant -H bash -lc "cd /var/www/pterodactyl && php artisan $* --no-interaction"; }

# generate key only if empty/missing
if ! grep -qE '^APP_KEY=base64:.+' .env; then
  artisan key:generate --force
fi

artisan p:environment:setup -n --author dev@pyro.host --url http://localhost:3000 \
  --timezone America/Chicago --cache redis --session redis --queue redis \
  --settings-ui=true --redis-host 127.0.0.1 --redis-pass null --redis-port 6379

artisan p:environment:database -n --host 127.0.0.1 --port 3306 \
  --database panel --username pterodactyl --password password
artisan migrate --seed --force

log Ensuring developer user exists
if ! mysql -u root -D panel -N -B -e "SELECT id FROM users WHERE email='dev@pyro.host' LIMIT 1;" | grep -q .; then
  artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password dev || true
fi
mysql -u root -e "UPDATE panel.users SET root_admin = 1 WHERE email='dev@pyro.host'"

log Ensuring location exists
# ensure location and get its id
if ! mysql -u root -D panel -N -B -e "SELECT id FROM locations WHERE short='local' LIMIT 1;" | grep -q .; then
  artisan p:location:make --short=local --long=Local || true
fi
LOCATION_ID=$(mysql -u root -D panel -N -B -e "SELECT id FROM locations WHERE short='local' LIMIT 1;")

log Ensuring node exists
# create node only if missing; avoid spaces in options
if ! mysql -u root -D panel -N -B -e "SELECT id FROM nodes WHERE name='local' LIMIT 1;" | grep -q .; then
  artisan p:node:make \
    --name=local \
    --description=DevNode \
    --locationId="$LOCATION_ID" \
    --fqdn=localhost \
    --public=1 \
    --scheme=http \
    --proxy=no \
    --maxMemory=8192 --overallocateMemory=0 \
    --maxDisk=32768 --overallocateDisk=0 \
    --uploadSize=100 || true
fi
NODE_ID=$(mysql -u root -D panel -N -B -e "SELECT id FROM nodes WHERE name='local' LIMIT 1;")

log Adding dummy allocations
for i in $(seq 25500 25600); do
  mysql -u root -e "INSERT IGNORE INTO panel.allocations (node_id, ip, port)
                    VALUES ($NODE_ID, 'localhost', $i)"
done

log Registering database host
if [ -n "$NODE_ID" ]; then
  mysql -u root -e "INSERT INTO panel.database_hosts
  (name, host, port, username, password, max_databases, node_id, created_at, updated_at)
  SELECT 'Local Database Host','127.0.0.1',3306,'dbhost','dbhostpassword',NULL,$NODE_ID,NOW(),NOW()
  WHERE NOT EXISTS (SELECT 1 FROM panel.database_hosts WHERE name='Local Database Host')"
fi

popd >/dev/null

log Installing Laravel scheduler cron
( crontab -l 2>/dev/null | grep -v 'pterodactyl/artisan schedule:run' || true
  echo '* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1'
) | crontab -

log Creating pteroq.service
cat >/etc/systemd/system/pteroq.service <<EOF
[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service
Requires=redis-server.service
[Service]
User=vagrant
Group=vagrant
WorkingDirectory=/var/www/pterodactyl
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitIntervalSec=180
StartLimitBurst=30
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

log Installing Docker Engine
install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  >/etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

log Installing Wings
install -d -m 0755 /etc/pterodactyl
ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=amd64 || ARCH=arm64
curl -fsSL -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_${ARCH}"
chmod u+x /usr/local/bin/wings
sudo -u vagrant -H bash -lc 'cd /var/www/pterodactyl && php artisan p:node:configuration 1' >/etc/pterodactyl/config.yml || true

cat >/etc/systemd/system/wings.service <<EOF
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitIntervalSec=180
StartLimitBurst=30
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

log Reloading systemd and starting services
systemctl daemon-reload
systemctl enable --now pteroq
systemctl enable --now wings

log Generating Application API Key
pushd /var/www/pterodactyl >/dev/null
API_KEY_RESULT=$(sudo -u vagrant -H bash -lc 'php artisan tinker --execute="
use Pterodactyl\Models\ApiKey;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Api\KeyCreationService;
\$user = User::find(1);
if (!\$user) { exit; }
if (ApiKey::query()->where(\"user_id\", \$user->id)->where(\"memo\", \"Development API Key\")->exists()) { echo \"\"; exit; }
\$service = app(KeyCreationService::class);
\$apiKey = \$service->setKeyType(2)->handle(
  [\"user_id\" => \$user->id, \"memo\" => \"Development API Key\"],
  [\"r_servers\" => 3, \"r_nodes\" => 3, \"r_allocations\" => 3, \"r_users\" => 3,
   \"r_locations\" => 3, \"r_nests\" => 3, \"r_eggs\" => 3, \"r_database_hosts\" => 3, \"r_server_databases\" => 3]
);
echo \$apiKey->identifier . decrypt(\$apiKey->token);
"') || true
API_KEY=$(echo "${API_KEY_RESULT:-}" | tail -1 || true)
popd >/dev/null

if [ -n "${API_KEY:-}" ]; then
  log API Key generated
  echo API_KEY=$API_KEY >> /home/vagrant/.bashrc
  sleep 10
  log Creating Minecraft server
  # Get the first allocation ID for this node
  ALLOCATION_ID=$(mysql -u root -D panel -N -B -e "SELECT id FROM allocations WHERE node_id=$NODE_ID LIMIT 1;" 2>/dev/null || echo "")
  
  if [ -z "$ALLOCATION_ID" ]; then
    warn "No allocations found for node $NODE_ID, skipping server creation"
  else
    # Create a temporary server config with dynamic values in /tmp
    cat >/tmp/server_create.json <<EOF
{
    "external_id": null,
    "name": "Minecraft Vanilla Dev Server",
    "description": "Development Minecraft Vanilla Server with 4GB RAM, 32GB storage, 4 cores",
    "user": 1,
    "egg": 7,
    "docker_image": "ghcr.io/pterodactyl/yolks:java_17",
    "startup": "java -Xms128M -Xmx4096M -jar {{SERVER_JARFILE}}",
    "environment": {
        "SERVER_JARFILE": "server.jar",
        "VANILLA_VERSION": "latest"
    },
    "limits": {
        "memory": 4096,
        "overhead_memory": 2048,
        "swap": 0,
        "disk": 32768,
        "io": 500,
        "cpu": 400
    },
    "feature_limits": {
        "databases": 0,
        "allocations": 1
    },
    "allocation": {
        "default": $ALLOCATION_ID
    },
    "deploy": {
        "locations": [
            $LOCATION_ID
        ],
        "dedicated_ip": false,
        "port_range": []
    },
    "start_on_completion": false,
    "skip_scripts": false,
    "oom_disabled": false
}
EOF
    
    SERVER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/application/servers \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -H "Accept: Application/vnd.pterodactyl.v1+json" \
      -d @/tmp/server_create.json 2>/dev/null || echo '{"error":"curl_failed"}')
    rm -f /tmp/server_create.json
    
    if echo "$SERVER_RESPONSE" | grep -q '"object":"server"'; then
      SERVER_ID=$(echo "$SERVER_RESPONSE" | jq -r '.attributes.id' 2>/dev/null || echo "")
      SERVER_UUID=$(echo "$SERVER_RESPONSE" | jq -r '.attributes.uuid' 2>/dev/null || echo "")
      if [ -n "$SERVER_ID" ] && [ "$SERVER_ID" != "null" ]; then
        echo SERVER_ID=$SERVER_ID >> /home/vagrant/.bashrc
        echo SERVER_UUID=$SERVER_UUID >> /home/vagrant/.bashrc
        curl -s -X POST http://localhost:3000/api/application/servers/$SERVER_ID/reinstall \
          -H "Authorization: Bearer $API_KEY" \
          -H "Accept: Application/vnd.pterodactyl.v1+json" >/dev/null 2>&1 || true
        log "Server created successfully with ID: $SERVER_ID"
      else
        warn "Server creation succeeded but failed to extract server ID"
      fi
    else
      warn "Server creation failed or returned unexpected response"
      # Don't show the full response as it might contain sensitive info, just log the attempt
    fi
  fi
else
  log API key already exists, skipping creation
fi

systemctl restart php8.3-fpm
systemctl reload nginx || systemctl restart nginx || true

echo
echo === Provisioning Complete ===
echo Panel:   http://localhost:3000
echo Login:   dev / dev
echo API Key: ${API_KEY:-<not created on this run>}
