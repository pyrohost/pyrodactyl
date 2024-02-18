#!/bin/bash

# Disable SELinux
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config

# Update the system 
dnf update -y

# Install the EPEL and Remi repositories
dnf -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
dnf -y install https://rpms.remirepo.net/enterprise/remi-release-9.rpm
dnf -y config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Redis
dnf -y install redis
systemctl enable --now redis

# Install PHP 8.1 and configure PHP-FPM
dnf -y module enable php:remi-8.1
dnf -y install php php-{cli,gd,mysqlnd,mbstring,bcmath,xml,fpm,curl,zip,posix}
cat > /etc/php-fpm.d/pterodactyl.conf << EOF
[pterodactyl]
user = vagrant
group = vagrant
listen = /run/php-fpm/pterodactyl.sock
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

systemctl enable --now php-fpm

# Install Nginx and the panel configuration
dnf -y install nginx
sed -i 's/user nginx;/user vagrant;/' /etc/nginx/nginx.conf
cat > /etc/nginx/conf.d/pterodactyl.conf << EOF
server {
    listen 3000;
    server_name localhost;

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
        fastcgi_pass unix:/run/php-fpm/pterodactyl.sock;
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

systemctl enable --now nginx

# Install MariaDB
dnf -y install mariadb-server
systemctl enable --now mariadb

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Enter the web directory
cd /var/www/pterodactyl
chmod -R 755 storage/* bootstrap/cache/

# Create the database for the panel
mysql -u root -e "CREATE DATABASE panel;" \
    -e "CREATE USER 'pterodactyl'@'localhost' IDENTIFIED BY 'password';" \
    -e "GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'localhost' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Create the database host user
mysql -u root -e "CREATE USER 'pterodactyluser'@'localhost' IDENTIFIED BY 'password';" \
    -e "GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'localhost' WITH GRANT OPTION;" \
    -e "FLUSH PRIVILEGES;"

# Initialize the Pterodactyl panel
cp .env.example .env
php /usr/local/bin/composer install --no-dev --optimize-autoloader

# PHP Artisan commands
php artisan key:generate --force
php artisan p:environment:setup -n --author dev@pyro.host --url http://0.0.0.0:3000 --cache redis --session redis --queue redis
php artisan p:environment:database -n --host localhost --port 3306 --database panel --username pterodactyl --password password
php artisan migrate --seed --force

# Create a developer user
php artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password password
mysql -u root -e "USE panel; UPDATE users SET root_admin = 1;" # workaround because --admin is broken

# Make a location and node for the panel
php artisan p:location:make -n --short local --long Local
php artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn localhost --public 1 --scheme http --proxy 0 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0

# Add some dummy allocations to the node
mysql -u root -e "USE panel; INSERT INTO allocations (node_id, ip, port) VALUES (1, '0.0.0.0', 25565), (1, '0.0.0.0', 25566), (1, '0.0.0.0', 25567);"

# Set the crontab for the panel
(crontab -l 2>/dev/null; echo "* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1") | crontab -

# Install the queue worker
cat > /etc/systemd/system/pteroq.service << EOF 
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

systemctl enable --now pteroq

# Install Docker
dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# Setup wings
mkdir -p /etc/pterodactyl
curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
chmod u+x /usr/local/bin/wings

# Configure wings
php artisan p:node:configuration 1 > /etc/pterodactyl/config.yml
cat > /etc/systemd/system/wings.service << EOF
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
systemctl enable --now wings
