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

      configurationNix = {
        imports = [
          ./configuration.nix
        ];

        systemd.timers.pterodactyl-cron.timer = {
          description = "Run Pterodactyl Scheduler every minute";
          wantedBy = [ "timers.target" ];
          timerConfig.OnUnitActiveSec = "1m";
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

      nixosSystem = pkgs.nixosSystem {
        inherit system;
        modules = [ configurationNix ];
      };

    in {
      defaultPackage = nixosSystem.config.system.build.toplevel;

    devShell = pkgs.mkShell {
      buildInputs = [
        pkgs.php
        pkgs.phpPackages.composer
        pkgs.redis
        pkgs.nginx
        pkgs.docker
        pkgs.docker-compose
        pkgs.mysql
        pkgs.nodejs_20
      ];
    shellHook = let
      dataDir = "./data";
    in ''
      echo "Starting Redis in the dev shell..."

      # Start Redis in the background
      redis-server --daemonize yes

      echo "Redis is running!"

      # Define cleanup function to stop services
      cleanup() {
        echo "Stopping Redis..."
        pkill redis-server
      }

      # Register cleanup on shell exit
      trap cleanup EXIT
    '';



};
});
}

