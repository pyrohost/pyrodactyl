#!/usr/bin/env bash
set -euo pipefail

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
warn() { echo -e "\n\033[1;33m!! $*\033[0m"; }
err() { echo -e "\n\033[1;31m!! $*\033[0m" >&2; }

export DEBIAN_FRONTEND=noninteractive

log Checking and updating OS packages
if [ ! -f /var/lib/pterodactyl-provision/packages-updated ]; then
  apt-get update -y
  apt-get upgrade -y
  mkdir -p /var/lib/pterodactyl-provision
  touch /var/lib/pterodactyl-provision/packages-updated
else
  log "OS packages already updated, skipping"
fi

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
ufw allow 9000/tcp # MinIO API
ufw allow 9001/tcp # MinIO Console
ufw allow 8025/tcp # Mailpit Web UI
ufw allow 1025/tcp # Mailpit SMTP
ufw allow 25500:25600/tcp
ufw allow 25500:25600/udp

log Installing Redis
apt-get install -y redis-server
systemctl enable --now redis-server

log Adding PHP 8.3 repository
if [ ! -f /var/lib/pterodactyl-provision/php-repo-added ]; then
  add-apt-repository -y ppa:ondrej/php
  apt-get update -y
  touch /var/lib/pterodactyl-provision/php-repo-added
else
  log "PHP repository already added, skipping"
fi

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
StartLimitBurst=30
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

log Installing Docker Engine
if ! command -v docker >/dev/null 2>&1; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed, skipping"
fi

log Installing Wings
install -d -m 0755 /etc/pterodactyl
if [ ! -f /usr/local/bin/wings ]; then
  ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=amd64 || ARCH=arm64
  curl -fsSL -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_${ARCH}"
  chmod u+x /usr/local/bin/wings
else
  log "Wings already installed, skipping download"
fi
if [ ! -f /etc/pterodactyl/config.yml ]; then
  sudo -u vagrant -H bash -lc 'cd /var/www/pterodactyl && php artisan p:node:configuration 1' >/etc/pterodactyl/config.yml || true
else
  log "Wings config already exists, skipping"
fi

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
StartLimitBurst=30
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

log Reloading systemd and starting services
systemctl daemon-reload
systemctl enable --now pteroq
systemctl enable --now wings

log Installing MinIO
if ! command -v minio >/dev/null 2>&1; then
  ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=amd64 || ARCH=arm64
  curl -fsSL -o /usr/local/bin/minio "https://dl.min.io/server/minio/release/linux-${ARCH}/minio"
  chmod +x /usr/local/bin/minio
  
  # Create minio user and directories
  useradd -r minio-user || true
  mkdir -p /opt/minio/data
  mkdir -p /etc/minio
  chown minio-user:minio-user /opt/minio/data
  
  # Create MinIO environment file
  cat >/etc/minio/minio.conf <<EOF
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_VOLUMES=/opt/minio/data
MINIO_OPTS="--console-address :9001"
EOF
  
  # Create systemd service
  cat >/etc/systemd/system/minio.service <<EOF
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local

User=minio-user
Group=minio-user
ProtectProc=invisible

EnvironmentFile=/etc/minio/minio.conf
ExecStartPre=/bin/bash -c 'if [ -z "\${MINIO_VOLUMES}" ]; then echo "Variable MINIO_VOLUMES not set in /etc/minio/minio.conf"; exit 1; fi'
ExecStart=/usr/local/bin/minio server \$MINIO_OPTS \$MINIO_VOLUMES

# Let systemd restart this service always
Restart=always

# Specifies the maximum file descriptor number that can be opened by this process
LimitNOFILE=65536

# Specifies the maximum number of threads this process can create
TasksMax=infinity

# Disable timeout logic and wait until process is stopped
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF
  
  systemctl daemon-reload
  systemctl enable --now minio
  
  # Wait for MinIO to start
  sleep 5
  
  # Create default buckets using mc (MinIO Client)
  curl -fsSL -o /usr/local/bin/mc "https://dl.min.io/client/mc/release/linux-${ARCH}/mc"
  chmod +x /usr/local/bin/mc
  
  # Configure mc alias and create buckets
  sudo -u vagrant -H bash -c '
    /usr/local/bin/mc alias set local http://localhost:9000 minioadmin minioadmin
    /usr/local/bin/mc mb local/pterodactyl-backups --ignore-existing
  ' || true
  
  # Configure MinIO in .env for S3 backups
  pushd /var/www/pterodactyl >/dev/null
  if [ -f .env ]; then
    # Set S3 backup configuration for MinIO
    sed -i '/^APP_BACKUP_DRIVER=/c\APP_BACKUP_DRIVER=s3' .env
    
    # Configure AWS/S3 settings for MinIO
    if grep -q "^AWS_ACCESS_KEY_ID=" .env; then
      sed -i '/^AWS_ACCESS_KEY_ID=/c\AWS_ACCESS_KEY_ID=minioadmin' .env
    else
      echo 'AWS_ACCESS_KEY_ID=minioadmin' >> .env
    fi
    
    if grep -q "^AWS_SECRET_ACCESS_KEY=" .env; then
      sed -i '/^AWS_SECRET_ACCESS_KEY=/c\AWS_SECRET_ACCESS_KEY=minioadmin' .env
    else
      echo 'AWS_SECRET_ACCESS_KEY=minioadmin' >> .env
    fi
    
    if grep -q "^AWS_DEFAULT_REGION=" .env; then
      sed -i '/^AWS_DEFAULT_REGION=/c\AWS_DEFAULT_REGION=us-east-1' .env
    else
      echo 'AWS_DEFAULT_REGION=us-east-1' >> .env
    fi
    
    if grep -q "^AWS_BACKUPS_BUCKET=" .env; then
      sed -i '/^AWS_BACKUPS_BUCKET=/c\AWS_BACKUPS_BUCKET=pterodactyl-backups' .env
    else
      echo 'AWS_BACKUPS_BUCKET=pterodactyl-backups' >> .env
    fi
    
    if grep -q "^AWS_ENDPOINT=" .env; then
      sed -i '/^AWS_ENDPOINT=/c\AWS_ENDPOINT=http://localhost:9000' .env
    else
      echo 'AWS_ENDPOINT=http://localhost:9000' >> .env
    fi
    
    if grep -q "^AWS_USE_PATH_STYLE_ENDPOINT=" .env; then
      sed -i '/^AWS_USE_PATH_STYLE_ENDPOINT=/c\AWS_USE_PATH_STYLE_ENDPOINT=true' .env
    else
      echo 'AWS_USE_PATH_STYLE_ENDPOINT=true' >> .env
    fi
  fi
  popd >/dev/null
  
  log "MinIO installed and configured successfully"
  log "MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
else
  log "MinIO already installed, skipping"
fi

log Installing Mailpit
if ! command -v mailpit >/dev/null 2>&1; then
  ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=linux-amd64 || ARCH=linux-arm64
  MAILPIT_VERSION=$(curl -s https://api.github.com/repos/axllent/mailpit/releases/latest | jq -r .tag_name)
  curl -fsSL -o /tmp/mailpit.tar.gz "https://github.com/axllent/mailpit/releases/download/${MAILPIT_VERSION}/mailpit-${ARCH}.tar.gz"
  tar -xzf /tmp/mailpit.tar.gz -C /tmp
  mv /tmp/mailpit /usr/local/bin/
  chmod +x /usr/local/bin/mailpit
  rm -f /tmp/mailpit.tar.gz
  
  # Create mailpit user
  useradd -r mailpit-user || true
  
  # Create systemd service
  cat >/etc/systemd/system/mailpit.service <<EOF
[Unit]
Description=Mailpit SMTP testing server
After=network.target

[Service]
ExecStart=/usr/local/bin/mailpit --smtp 0.0.0.0:1025 --listen 0.0.0.0:8025
User=mailpit-user
Group=mailpit-user
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  
  systemctl daemon-reload
  systemctl enable --now mailpit
  
  # Configure Mailpit in .env for mail testing
  pushd /var/www/pterodactyl >/dev/null
  if [ -f .env ]; then
    # Set mail configuration for Mailpit
    if grep -q "^MAIL_MAILER=" .env; then
      sed -i '/^MAIL_MAILER=/c\MAIL_MAILER=smtp' .env
    else
      echo 'MAIL_MAILER=smtp' >> .env
    fi
    
    if grep -q "^MAIL_HOST=" .env; then
      sed -i '/^MAIL_HOST=/c\MAIL_HOST=localhost' .env
    else
      echo 'MAIL_HOST=localhost' >> .env
    fi
    
    if grep -q "^MAIL_PORT=" .env; then
      sed -i '/^MAIL_PORT=/c\MAIL_PORT=1025' .env
    else
      echo 'MAIL_PORT=1025' >> .env
    fi
    
    if grep -q "^MAIL_USERNAME=" .env; then
      sed -i '/^MAIL_USERNAME=/c\MAIL_USERNAME=' .env
    else
      echo 'MAIL_USERNAME=' >> .env
    fi
    
    if grep -q "^MAIL_PASSWORD=" .env; then
      sed -i '/^MAIL_PASSWORD=/c\MAIL_PASSWORD=' .env
    else
      echo 'MAIL_PASSWORD=' >> .env
    fi
    
    if grep -q "^MAIL_ENCRYPTION=" .env; then
      sed -i '/^MAIL_ENCRYPTION=/c\MAIL_ENCRYPTION=' .env
    else
      echo 'MAIL_ENCRYPTION=' >> .env
    fi
    
    if grep -q "^MAIL_FROM_ADDRESS=" .env; then
      sed -i '/^MAIL_FROM_ADDRESS=/c\MAIL_FROM_ADDRESS=no-reply@localhost' .env
    else
      echo 'MAIL_FROM_ADDRESS=no-reply@localhost' >> .env
    fi
  fi
  popd >/dev/null
  
  log "Mailpit installed and configured successfully"
  log "Mailpit Web UI: http://localhost:8025"
else
  log "Mailpit already installed, skipping"
fi

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
        "allocations": 1,
        "backups": 0
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
    
    # Check if a Minecraft server already exists
    EXISTING_SERVER=$(mysql -u root -D panel -N -B -e "SELECT id FROM servers WHERE name='Minecraft Vanilla Dev Server' LIMIT 1;" 2>/dev/null || echo "")
    
    if [ -n "$EXISTING_SERVER" ]; then
      log "Minecraft server already exists with ID: $EXISTING_SERVER, skipping creation"
      if ! grep -q "SERVER_ID=" /home/vagrant/.bashrc 2>/dev/null; then
        echo SERVER_ID=$EXISTING_SERVER >> /home/vagrant/.bashrc
        SERVER_UUID=$(mysql -u root -D panel -N -B -e "SELECT uuid FROM servers WHERE id=$EXISTING_SERVER;" 2>/dev/null || echo "")
        if [ -n "$SERVER_UUID" ]; then
          echo SERVER_UUID=$SERVER_UUID >> /home/vagrant/.bashrc
        fi
      fi
    else
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
    rm -f /tmp/server_create.json
  fi
else
  log API key already exists, skipping creation
fi

systemctl restart php8.3-fpm
systemctl reload nginx || systemctl restart nginx || true

echo "======================================="
echo "        Provisioning Complete"
echo "======================================="
echo
echo "=== Development Services ==="
echo "Mailpit Web UI:    http://localhost:8025"
echo "MinIO Console:     http://localhost:9001"
echo "MinIO Credentials: minioadmin / minioadmin"
echo
echo "Panel:             http://localhost:3000"
echo "Login:             dev / dev"
echo "API Key:           ${API_KEY:-<not created on this run>}"
echo
