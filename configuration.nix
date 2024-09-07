{ config, pkgs, ... }:

{
  # System Packages
  environment.systemPackages = with pkgs; [
    cowsay
    lolcat
    php
    phpPackages.composer
    redis
    nginx
    mysql
    docker
    docker-compose
    nodejs_20
  ];

  pyrodactylPath = builtins.toString ./.;

  # Users
  users.users.nix = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
  };

  # Services Configuration
  services.redis.enable = true;

  services.mysql = {
    enable = true;
    package = pkgs.mariadb;
    ensureDatabases = [
      { name = "panel"; }
    ];
    ensureUsers = [
      {
        name = "pyrodactyl";
        password = "password";
        grants = [
          "ALL PRIVILEGES ON panel.*"
        ];
      }
      {
        name = "pyrodactyluser";
        password = "pyrodactyl";
        grants = [
          "ALL PRIVILEGES ON *.*"
        ];
      }
    ];
  };

  services.phpfpm = {
    enable = true;
    pools = [
      {
        name = "pyerodactyl";
        user = "nix";
        group = "nix";
        listen = "/run/php-fpm/pterodactyl.sock";
        listenOwner = "nix";
        listenGroup = "nix";
        pm = "ondemand";
        pm.maxChildren = 50;
        pm.startServers = 5;
        pm.minSpareServers = 5;
        pm.maxSpareServers = 10;
        pm.processIdleTimeout = "10s";
        pm.maxRequests = 500;
        chdir = "/";
      }
    ];
  };

  services.nginx = {
    enable = true;
    virtualHosts = {
      "localhost" = {
        root = "${pyrodactylPath}/public";
        index = ["index.html", "index.htm", "index.php"];
        location = ''
          try_files $uri $uri/ /index.php?$query_string;
          location = /favicon.ico { access_log off; log_not_found off; }
          location = /robots.txt { access_log off; log_not_found off; }
          client_max_body_size 100m;
          client_body_timeout 120s;
        '';
        extraConfig = ''
          location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/run/php-fpm/pterodactyl.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
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
        '';
      };
    };
  };

  # Composer
  environment.systemPackages = with pkgs; [ composer ];

  # Docker
  services.docker.enable = true;

  # Pterodactyl Cron Service
  systemd.services.pterodactyl-cron = {
    description = "Pterodactyl Scheduler";
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${pkgs.php}/bin/php ${pyrodactylPath}/artisan schedule:run";
      User = "nix";
      Group = "nix";
    };
  };

  # Pterodactyl Queue Worker
  systemd.services.pteroq = {
    description = "Pterodactyl Queue Worker";
    after = [ "redis.service" ];
    serviceConfig = {
      User = "nix";
      Group = "nix";
      ExecStart = "${pkgs.php}/bin/php ${pyrodactylPath}/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3";
      Restart = "always";
    };
    wantedBy = [ "multi-user.target" ];
  };

  # Wings Daemon (Commented out)
  # systemd.services.wings = {
  #   description = "Pterodactyl Wings Daemon";
  #   after = [ "docker.service" ];
  #   requires = [ "docker.service" ];
  #   workingDirectory = "/etc/pterodactyl";
  #   execStart = "/usr/local/bin/wings";
  #   restart = "on-failure";
  #   user = "root";
  #   limitNOFILE = 4096;
  #   pidFile = "/var/run/wings/daemon.pid";
  # };
}
