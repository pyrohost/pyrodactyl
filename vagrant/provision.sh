#!/bin/bash

# Update the system
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Configure firewall for database and web access
ufw --force enable
ufw allow ssh
ufw allow 3306/tcp
ufw allow 3000/tcp
ufw allow 8080/tcp
ufw allow 25565:25567/tcp

# Install Redis
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Add PHP repository and install PHP 8.3
apt-get install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update

# Install PHP 8.3 and required extensions
apt-get install -y php8.3 php8.3-cli php8.3-gd php8.3-mysql php8.3-mbstring php8.3-bcmath php8.3-xml php8.3-fpm php8.3-curl php8.3-zip php8.3-posix

# Configure PHP-FPM
cat >/etc/php/8.3/fpm/pool.d/pterodactyl.conf <<EOF
[pterodactyl]
user = vagrant
group = vagrant
listen = /run/php/pterodactyl.sock
listen.owner = vagrant
listen.group = vagrant
pm = ondemand
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 10
pm.process_idle_timeout = 10s
pm.max_requests = 500
chdir = /
EOF

systemctl enable php8.3-fpm
systemctl start php8.3-fpm

# Install Nginx and configure
apt-get install -y nginx
sed -i 's/user www-data;/user vagrant;/' /etc/nginx/nginx.conf
cat >/etc/nginx/sites-available/pterodactyl.conf <<EOF
server {
    listen 3000;
    server_name 127.0.0.1;

    root /var/www/pterodactyl/public;
    index index.html index.htm index.php;
    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;

    # allow larger file uploads and longer script runtimes
    client_max_body_size 100m;
    client_body_timeout 120s;

    sendfile off;

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/pterodactyl.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable the site and remove default
ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

systemctl enable nginx
systemctl start nginx

# Install MariaDB
apt-get install -y mariadb-server mariadb-client

# Configure MariaDB for external connections
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

systemctl enable mariadb
systemctl start mariadb

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Enter the web directory
cd /var/www/pterodactyl || exit
chmod -R 755 storage/* bootstrap/cache/

# Create the database for the panel
mysql -u root -e "CREATE DATABASE panel;" \
    -e "CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'password';" \
    -e "GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Create the database host user for local and remote connections
mysql -u root -e "CREATE USER 'pterodactyluser'@'127.0.0.1' IDENTIFIED BY 'password';" \
    -e "CREATE USER 'pterodactyluser'@'%' IDENTIFIED BY 'password';" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'127.0.0.1' WITH GRANT OPTION;" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'%' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Create a dedicated database host user for Pterodactyl panel
mysql -u root -e "CREATE USER 'dbhost'@'127.0.0.1' IDENTIFIED BY 'dbhostpassword';" \
    -e "CREATE USER 'dbhost'@'%' IDENTIFIED BY 'dbhostpassword';" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'dbhost'@'127.0.0.1' WITH GRANT OPTION;" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'dbhost'@'%' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Initialize the Pterodactyl panel
cp .env.example .env
php /usr/local/bin/composer install --no-dev --optimize-autoloader

# PHP Artisan commands
php artisan key:generate --force
php artisan p:environment:setup -n --author dev@pyro.host --url http://127.0.0.1:3000 --cache redis --session redis --queue redis
php artisan p:environment:database -n --host 127.0.0.1 --port 3306 --database panel --username pterodactyl --password password
php artisan migrate --seed --force

# Create a developer user
php artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password dev
mysql -u root -e "USE panel; UPDATE users SET root_admin = 1;" # workaround because --admin is broken

# Make a location and node for the panel
php artisan p:location:make -n --short local --long Local
php artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn 127.0.0.1 --public 1 --scheme http --proxy 0 --maxMemory 8192 --maxDisk 32768 --overallocateMemory 0 --overallocateDisk 0

# Add some dummy allocations to the node
mysql -u root -e "USE panel; INSERT INTO allocations (node_id, ip, port) VALUES (1, '127.0.0.1', 25565), (1, '127.0.0.1', 25566), (1, '127.0.0.1', 25567);"

# Create database host entry in Pterodactyl panel
mysql -u root -e "USE panel; INSERT INTO database_hosts (name, host, port, username, password, max_databases, node_id, created_at, updated_at) VALUES ('Local Database Host', '127.0.0.1', 3306, 'dbhost', 'dbhostpassword', NULL, 1, NOW(), NOW());"

# Set the crontab for the panel
(
    crontab -l 2>/dev/null
    echo "* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1"
) | crontab -

# Install the queue worker
cat >/etc/systemd/system/pteroq.service <<EOF
[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
User=vagrant
Group=vagrant
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

systemctl enable pteroq
systemctl start pteroq

# Install Docker
apt-get install -y ca-certificates curl gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# Setup wings
mkdir -p /etc/pterodactyl
curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
chmod u+x /usr/local/bin/wings

# Configure wings
php artisan p:node:configuration 1 >/etc/pterodactyl/config.yml
cat >/etc/systemd/system/wings.service <<EOF
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Enable and start wings
systemctl enable wings
systemctl start wings

# Generate Application API Key for development
echo "Generating Application API Key..."
cd /var/www/pterodactyl

# Use Laravel's KeyCreationService to create the API key properly
API_KEY_RESULT=$(php artisan tinker --execute="
\$service = app('Pterodactyl\Services\Api\KeyCreationService');
\$user = \Pterodactyl\Models\User::find(1);
\$apiKey = \$service->setKeyType(2)->handle([
    'user_id' => \$user->id,
    'memo' => 'Development API Key'
], [
    'r_servers' => 3,
    'r_nodes' => 3,
    'r_allocations' => 3,
    'r_users' => 3,
    'r_locations' => 3,
    'r_nests' => 3,
    'r_eggs' => 3,
    'r_database_hosts' => 3,
    'r_server_databases' => 3
]);
\$token = decrypt(\$apiKey->token);
echo \$apiKey->identifier . \$token;
")

API_KEY=$(echo "$API_KEY_RESULT" | tail -1)

if [ -n "$API_KEY" ]; then
    echo "API Key generated: $API_KEY"
    echo "API_KEY=$API_KEY" >> /home/vagrant/.bashrc
    
    # Wait for Wings to be fully started
    echo "Waiting for Wings to be ready..."
    sleep 10
    
    # Create Minecraft Vanilla Server via API
    echo "Creating Minecraft Vanilla Server via Pterodactyl API..."
    
    # Create the server using the API
    SERVER_RESPONSE=$(curl -s -X POST "http://127.0.0.1:3000/api/application/servers" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -H "Accept: Application/vnd.pterodactyl.v1+json" \
        -d '{
            "name": "Minecraft Vanilla Dev Server",
            "description": "Development Minecraft Vanilla Server with 4GB RAM, 32GB storage, 4 cores",
            "user": 1,
            "egg": 7,
            "docker_image": "ghcr.io/pterodactyl/yolks:java_17",
            "startup": "java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}",
            "environment": {
                "SERVER_JARFILE": "server.jar",
                "VANILLA_VERSION": "latest"
            },
            "limits": {
                "memory": 4096,
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
                "default": 1
            }
        }')
    
    # Check if server was created successfully
    if echo "$SERVER_RESPONSE" | grep -q '"object":"server"'; then
        SERVER_ID=$(echo "$SERVER_RESPONSE" | grep -oP '"id":\s*\K\d+' | head -1)
        SERVER_UUID=$(echo "$SERVER_RESPONSE" | grep -oP '"uuid":\s*"\K[^"]+' | head -1)
        echo "Minecraft server created successfully!"
        echo "Server ID: $SERVER_ID"
        echo "Server UUID: $SERVER_UUID"
        echo "SERVER_ID=$SERVER_ID" >> /home/vagrant/.bashrc
        echo "SERVER_UUID=$SERVER_UUID" >> /home/vagrant/.bashrc
        
        # Install the server
        echo "Installing Minecraft server..."
        curl -s -X POST "http://127.0.0.1:3000/api/application/servers/$SERVER_ID/reinstall" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -H "Accept: Application/vnd.pterodactyl.v1+json"
        
        echo "Minecraft server installation initiated. It may take a few minutes to complete."
    else
        echo "Failed to create Minecraft server. Response: $SERVER_RESPONSE"
    fi
else
    echo "Failed to generate API key"
fi

# Restart services to ensure proper configuration loading
systemctl restart php8.3-fpm
systemctl reload nginx

echo "=== Provisioning Complete ==="
echo "Pterodactyl Panel: http://127.0.0.1:3000"
echo "Login: dev@pyro.host / password"
echo "API Key: $API_KEY"
echo "Minecraft Server will be available once installation completes"