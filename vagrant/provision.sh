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
ufw allow 8081/tcp
ufw allow 9000/tcp # MinIO API
ufw allow 9001/tcp # MinIO Console
ufw allow 8025/tcp # Mailpit Web UI
ufw allow 1025/tcp # Mailpit SMTP
ufw allow 25500:25600/tcp
ufw allow 25500:25600/udp

log Installing Redis
apt-get install -y redis-server
systemctl enable --now redis-server

log Adding PHP 8.4 repository
if [ ! -f /var/lib/pterodactyl-provision/php-repo-added ]; then
  add-apt-repository -y ppa:ondrej/php
  apt-get update -y
  touch /var/lib/pterodactyl-provision/php-repo-added
else
  log "PHP repository already added, skipping"
fi

log Installing PHP 8.4 + extensions
apt-get install -y \
  php8.4 php8.4-cli php8.4-fpm php8.4-gd php8.4-mysql php8.4-mbstring \
  php8.4-bcmath php8.4-xml php8.4-curl php8.4-zip php8.4-readline php8.4-redis \
  php8.4-simplexml php8.4-dom

log Configuring PHP-FPM pool
cat >/etc/php/8.4/fpm/pool.d/pterodactyl.conf <<EOF
[pterodactyl]
user = vagrant
group = vagrant
listen = /run/php/pterodactyl.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660
pm = ondemand
pm.max_children = 50
pm.process_idle_timeout = 10s
pm.max_requests = 500
chdir = /
EOF

phpenmod -v 8.4 dom xml simplexml
usermod -a -G www-data vagrant

systemctl enable --now php8.4-fpm

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
    root /home/vagrant/pyrodactyl/public;
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

pushd /home/vagrant/pyrodactyl >/dev/null
[ -f .env ] || cp .env.example .env

sudo -u vagrant mkdir -p storage/framework/cache
sudo -u vagrant mkdir -p storage/framework/sessions
sudo -u vagrant mkdir -p storage/framework/views
sudo -u vagrant mkdir -p storage/logs
sudo -u vagrant mkdir -p bootstrap/cache

log Composer install
sudo -u vagrant -H bash -lc 'cd /home/vagrant/pyrodactyl && composer install --no-dev --optimize-autoloader'
chmod -R 755 storage bootstrap/cache
setfacl -Rm u:vagrant:rwX storage bootstrap/cache >/dev/null 2>&1 || true
chown -R vagrant:vagrant storage bootstrap/cache

# helper (append --no-interaction automatically; avoid quoted, spaced values)
artisan() { sudo -u vagrant -H bash -lc "cd /home/vagrant/pyrodactyl && php artisan $* --no-interaction"; }

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
  echo '* * * * * php /home/vagrant/pyrodactyl/artisan schedule:run >> /dev/null 2>&1'
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
WorkingDirectory=/home/vagrant/pyrodactyl
Restart=always
ExecStart=/usr/bin/php /home/vagrant/pyrodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
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

log Installing Elytra
install -d -m 0755 /etc/pterodactyl
install -d -m 0755 /etc/elytra
if [ ! -f /usr/local/bin/elytra ]; then
  ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=amd64 || ARCH=arm64
  curl -fsSL -o /usr/local/bin/elytra "https://github.com/pyrohost/elytra/releases/latest/download/elytra_linux_${ARCH}"
  chmod u+x /usr/local/bin/elytra
else
  log "Elytra already installed, skipping download"
fi

log Installing rustic for Elytra backups
if [ ! -f /usr/local/bin/rustic ]; then
  apt-get install -y libfuse2
  ARCH=$(uname -m); [[ $ARCH == x86_64 ]] && ARCH=x86_64 || ARCH=aarch64
  curl -fsSL -o /tmp/rustic.tar.gz "https://github.com/rustic-rs/rustic/releases/download/v0.10.0/rustic-v0.10.0-${ARCH}-unknown-linux-musl.tar.gz"
  tar -xf /tmp/rustic.tar.gz -C /tmp rustic
  mv /tmp/rustic /usr/local/bin/
  chmod +x /usr/local/bin/rustic
  rm -f /tmp/rustic.tar.gz
else
  log "Rustic already installed, skipping download"
fi

if [ ! -f /etc/pterodactyl/config.yml ]; then
  sudo -u vagrant -H bash -lc 'cd /home/vagrant/pyrodactyl && php artisan p:node:configuration 1' >/etc/pterodactyl/config.yml || true
else
  log "Elytra config already exists, skipping"
fi

cp /etc/pterodactyl/config.yml /etc/elytra/config.yml

cat >/etc/systemd/system/elytra.service <<EOF
[Unit]
Description=Pyrodactyl Elytra Daemon
After=docker.service
Requires=docker.service
[Service]
User=root
WorkingDirectory=/etc/elytra
LimitNOFILE=4096
ExecStart=/usr/local/bin/elytra
Restart=on-failure
StartLimitBurst=30
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

log Reloading systemd and starting services
systemctl daemon-reload
systemctl enable --now pteroq
systemctl enable --now elytra

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
  
  # Configure MinIO in .env for rustic_s3 backups
  pushd /home/vagrant/pyrodactyl >/dev/null
  if [ -f .env ]; then
    # Set rustic_s3 backup configuration for MinIO
    sed -i '/^APP_BACKUP_DRIVER=/c\APP_BACKUP_DRIVER=rustic_s3' .env

    # Configure rustic_s3 settings for MinIO
    if grep -q "^RUSTIC_S3_ENDPOINT=" .env; then
      sed -i '/^RUSTIC_S3_ENDPOINT=/c\RUSTIC_S3_ENDPOINT=http://localhost:9000' .env
    else
      echo 'RUSTIC_S3_ENDPOINT=http://localhost:9000' >> .env
    fi

    if grep -q "^RUSTIC_S3_REGION=" .env; then
      sed -i '/^RUSTIC_S3_REGION=/c\RUSTIC_S3_REGION=us-east-1' .env
    else
      echo 'RUSTIC_S3_REGION=us-east-1' >> .env
    fi

    if grep -q "^RUSTIC_S3_BUCKET=" .env; then
      sed -i '/^RUSTIC_S3_BUCKET=/c\RUSTIC_S3_BUCKET=pterodactyl-backups' .env
    else
      echo 'RUSTIC_S3_BUCKET=pterodactyl-backups' >> .env
    fi

    if grep -q "^RUSTIC_S3_PREFIX=" .env; then
      sed -i '/^RUSTIC_S3_PREFIX=/c\RUSTIC_S3_PREFIX=pterodactyl-backups/' .env
    else
      echo 'RUSTIC_S3_PREFIX=pterodactyl-backups/' >> .env
    fi

    if grep -q "^RUSTIC_S3_ACCESS_KEY_ID=" .env; then
      sed -i '/^RUSTIC_S3_ACCESS_KEY_ID=/c\RUSTIC_S3_ACCESS_KEY_ID=minioadmin' .env
    else
      echo 'RUSTIC_S3_ACCESS_KEY_ID=minioadmin' >> .env
    fi

    if grep -q "^RUSTIC_S3_SECRET_ACCESS_KEY=" .env; then
      sed -i '/^RUSTIC_S3_SECRET_ACCESS_KEY=/c\RUSTIC_S3_SECRET_ACCESS_KEY=minioadmin' .env
    else
      echo 'RUSTIC_S3_SECRET_ACCESS_KEY=minioadmin' >> .env
    fi

    if grep -q "^RUSTIC_S3_FORCE_PATH_STYLE=" .env; then
      sed -i '/^RUSTIC_S3_FORCE_PATH_STYLE=/c\RUSTIC_S3_FORCE_PATH_STYLE=true' .env
    else
      echo 'RUSTIC_S3_FORCE_PATH_STYLE=true' >> .env
    fi

    if grep -q "^RUSTIC_S3_DISABLE_SSL=" .env; then
      sed -i '/^RUSTIC_S3_DISABLE_SSL=/c\RUSTIC_S3_DISABLE_SSL=true' .env
    else
      echo 'RUSTIC_S3_DISABLE_SSL=true' >> .env
    fi
  fi
  popd >/dev/null
  
log Installing phpMyAdmin
export DEBIAN_FRONTEND=noninteractive
echo 'phpmyadmin phpmyadmin/dbconfig-install boolean true' | debconf-set-selections
echo 'phpmyadmin phpmyadmin/app-password-confirm password ptero' | debconf-set-selections
echo 'phpmyadmin phpmyadmin/mysql/admin-pass password ptero' | debconf-set-selections
echo 'phpmyadmin phpmyadmin/mysql/app-pass password ptero' | debconf-set-selections
echo 'phpmyadmin phpmyadmin/reconfigure-webserver multiselect' | debconf-set-selections

apt install -y phpmyadmin php8.4-mbstring php8.4-zip php8.4-gd php8.4-curl

mysql -u pterodactyl -ppassword -D panel -e "
CREATE USER IF NOT EXISTS 'phpmyadmin'@'localhost' IDENTIFIED BY 'phpmyadmin';
GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
" 2>/dev/null || true

mysql -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('rootpassword');" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'admin';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;" 2>/dev/null || true
mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

cat > /etc/phpmyadmin/conf.d/99-custom.php << 'PHPEOF'
<?php
# Custom phpMyAdmin configuration for development
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['LoginCookieValidity'] = 3600;
$cfg['LoginCookieStore'] = 0;
PHPEOF

cat > /etc/nginx/sites-available/phpmyadmin.conf <<'EOF'
server {
    listen 8081;
    server_name localhost;
    root /usr/share/phpmyadmin;
    index index.php index.html;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht { deny all; }
}
EOF

ln -sf /etc/nginx/sites-available/phpmyadmin.conf /etc/nginx/sites-enabled/phpmyadmin.conf
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
  pushd /home/vagrant/pyrodactyl >/dev/null
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

systemctl restart php8.4-fpm
systemctl reload nginx || systemctl restart nginx || true

log Generating Application API Key
pushd /home/vagrant/pyrodactyl >/dev/null
API_KEY_RESULT=$(sudo -u vagrant -H bash -lc 'php artisan tinker --execute="
use Pterodactyl\Models\ApiKey;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Api\KeyCreationService;
\$user = User::find(1);
if (!\$user) { exit; }
ApiKey::query()->where(\"user_id\", \$user->id)->where(\"memo\", \"Development API Key\")->delete();
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
    "name": "Minecraft Vanilla Dev Server",
    "description": "Development Minecraft Vanilla Server with 4GB RAM, 32GB storage, 4 cores",
    "user": 1,
    "egg": 3,
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
    
    # Check if a Minecraft server already exists using Laravel
    pushd /home/vagrant/pyrodactyl >/dev/null
    EXISTING_SERVER_CHECK=$(sudo -u vagrant -H bash -lc 'php artisan tinker --execute="
use Pterodactyl\Models\Server;
\$server = Server::where(\"name\", \"Minecraft Vanilla Dev Server\")->first();
if (\$server) {
  echo \$server->id . \"|\" . \$server->uuid;
} else {
  echo \"none\";
}
"') 2>/dev/null || echo "none"
    popd >/dev/null

    if [ "$EXISTING_SERVER_CHECK" != "none" ]; then
      EXISTING_SERVER=$(echo "$EXISTING_SERVER_CHECK" | cut -d'|' -f1)
      EXISTING_UUID=$(echo "$EXISTING_SERVER_CHECK" | cut -d'|' -f2)
      log "Minecraft server already exists with ID: $EXISTING_SERVER, skipping creation"
      if ! grep -q "SERVER_ID=" /home/vagrant/.bashrc 2>/dev/null; then
        echo SERVER_ID=$EXISTING_SERVER >> /home/vagrant/.bashrc
        if [ -n "$EXISTING_UUID" ]; then
          echo SERVER_UUID=$EXISTING_UUID >> /home/vagrant/.bashrc
        fi
      fi
    else
      log "Waiting for API to be ready..."
      # Wait for API to be accessible and test authentication
      for i in {1..30}; do
        API_TEST=$(curl -s -H "Authorization: Bearer $API_KEY" -H "Accept: Application/vnd.pterodactyl.v1+json" http://localhost:3000/api/application/users 2>/dev/null || echo "failed")
        if echo "$API_TEST" | grep -q '"object":"list"'; then
          log "API is ready"
          break
        fi
        if [ $i -eq 30 ]; then
          warn "API failed to become ready after 30 attempts, skipping server creation"
          break
        fi
        sleep 2
      done

      log "Attempting to create server with allocation ID: $ALLOCATION_ID, location ID: $LOCATION_ID"
      SERVER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/application/servers \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -H "Accept: Application/vnd.pterodactyl.v1+json" \
        -d @/tmp/server_create.json 2>/dev/null || echo '{"error":"curl_failed"}')

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
        warn "Server creation failed. Response saved to /tmp/server_response.json"
        if [ -f /tmp/server_response.json ]; then
          log "Error details: $(head -3 /tmp/server_response.json)"
        fi
      fi
      rm -f /tmp/server_create.json
    fi
    rm -f /tmp/server_create.json
  fi
else
  log API key already exists, skipping creation
fi



echo "======================================="
echo "        Provisioning Complete"
echo "======================================="
echo
echo "=== Development Services ==="
echo "Mailpit Web UI:    http://localhost:8025"
echo "MinIO Console:     http://localhost:9001"
echo "MinIO Credentials: minioadmin / minioadmin"
echo "phpMyAdmin:        http://localhost:8081"
echo "phpMyAdmin Logins: root/rootpassword, admin/admin, pterodactyl/password"
echo
echo "Panel:             http://localhost:3000"
echo "Login:             dev / dev"
echo "API Key:           ${API_KEY:-<not created on this run>}"
echo
