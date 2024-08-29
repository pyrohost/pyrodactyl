{
  description = "PyroPanel";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs { inherit system; };

      pyrodactylPath = builtins.toString ./.;

      # Define the NixOS configuration if using NixOS
      configurationNix = {
        imports = [
          ./configuration.nix # Import your configuration.nix here
        ];

        systemd.timers.pterodactyl-cron.timer = {
          description = "Run Pterodactyl Scheduler every minute";
          wantedBy = [ "timers.target" ];
          timerConfig = {
            OnUnitActiveSec = "1m";
          };
        };

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

        systemd.services.wings = {
          description = "Pterodactyl Wings Daemon";
          after = [ "docker.service" ];
          requires = [ "docker.service" ];
          workingDirectory = "/etc/pterodactyl";
          execStart = "/usr/local/bin/wings";
          restart = "on-failure";
          user = "root";
          limitNOFILE = 4096;
          pidFile = "/var/run/wings/daemon.pid";
        };
      };

      # Define the NixOS system
      nixosSystem = pkgs.nixosSystem {
        inherit system;
        modules = [ configurationNix ];
      };

    in {
      # For NixOS users
      defaultPackage = nixosSystem.config.system.build.toplevel;

      # Define the development shell
      devShell = pkgs.mkShell {
        buildInputs = [
          pkgs.php
          pkgs.phpPackages.composer
          pkgs.redis
          pkgs.nginx
          pkgs.mysql
          pkgs.docker
          pkgs.docker-compose
          pkgs.nodejs_20
        ];
      };
    });
}

