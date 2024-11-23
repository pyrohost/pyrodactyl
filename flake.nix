{
  description = "Laravel application with artisan serve behind a proxy";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: let
    pkgs = import nixpkgs { system = "x86_64-linux"; };
  in {
    # Define the default package
    defaultPackage.x86_64-linux = pkgs.writeShellScriptBin "laravel-server" ''
      #!/usr/bin/env bash
      export PATH=${pkgs.php}/bin:$PATH
      export PATH=${pkgs.redis}/bin:$PATH
      export PATH=${pkgs.git}/bin:$PATH
      export PATH=${pkgs.mariadb}/bin:$PATH
      export PATH=${pkgs.docker}/bin:$PATH
      export PATH=${pkgs.docker-compose}/bin:$PATH
      export PATH=${pkgs.caddy}/bin:$PATH


      redis-server --daemonize yes
      redis-server --daemonize yes
      redis-cli ping
      sleep 5
      #mariadb-install-server
      #php artisan serve --host=127.0.0.1 --port=8000

      # Clean up and create directories for MariaDB data
      echo "Deleting MariaDB data directory"
      rm -rf $(pwd)/nix/docker/maria/mariadb_data

      echo "Creating MariaDB data directory"
      mkdir -p $(pwd)/nix/docker/maria/mariadb_data

      bash ./nix/buildsteps.sh
      redis-cli shutdown
    '';

    # Development shell
    devShell.x86_64-linux = pkgs.mkShell {
      nativeBuildInputs = [
        pkgs.php
        pkgs.phpPackages.composer
        pkgs.caddy
        pkgs.nodejs_20
        pkgs.tmux
        pkgs.redis
        pkgs.mariadb
        pkgs.docker
        pkgs.docker-compose
      ];

      shellHook = ''
        export LC_ALL=C.UTF-8
        export LANG=C.UTF-8
        echo "Laravel environment loaded."
        # Start Redis server as a background process
        redis-server --daemonize yes
        echo "Resetting MariaDB Data"

        # Clean up and create directories for MariaDB data
        echo "Deleting MariaDB data directory"
        rm -rf $(pwd)/nix/docker/maria/mariadb_data

        echo "Creating MariaDB data directory"
        mkdir -p $(pwd)/nix/docker/maria/mariadb_data



        echo "Run 'php artisan serve' to start the application."
      '';
    };


    # Systemd services
    nixosConfigurations.default = pkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        {
          systemd.services.laravel = {
            enabled=true;
            description = "Laravel PHP Artisan Service";
            wantedBy = [ "multi-user.target" ];
            serviceConfig = {
              ExecStart = "${self.defaultPackage.x86_64-linux}";
              Restart = "always";
              WorkingDirectory = ./app;
            };
          };

          systemd.services.nginx-proxy = {
            enabled=true;
            description = "NGINX Proxy for Laravel";
            wantedBy = [ "multi-user.target" ];
            serviceConfig = {
              ExecStart = "${pkgs.nginx}/bin/nginx -c ${self.nginxConfig}";
              Restart = "always";
            };

          services.mariadb = {
            enable = true;
            package = nixpkgs.pkgs.mariadb; # Ensure you have the correct version of MariaDB
            dataDir = "/var/lib/mysql";
            socket = "/var/run/mysqld/mysqld.sock";
            port = 3306;
            # Additional configuration settings
            rootPassword = "your_secure_password"; # Set the root password
          };
          };
        }
      ];
    };
  };
}

