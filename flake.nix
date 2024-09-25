{
  description = "PyroPanel";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs { inherit system; };

      pyrodactylPath = builtins.toString ./.;

    in {

    devShell = pkgs.mkShell {
      buildInputs = [
        pkgs.php
        pkgs.phpPackages.composer
        pkgs.redis
        pkgs.nginx
        pkgs.docker
        pkgs.docker-compose
        pkgs.mariadb
        pkgs.nodejs_20
        pkgs.tmux
      ];
    shellHook = let
      dataDir = "./data";
    in ''
      echo "Starting Redis in the dev shell..."

      # Start Redis in the background
      # These damn variables causing all sorts of issues when not here
      export LC_ALL=C.UTF-8
      export LANG=C.UTF-8
      redis-server --daemonize yes

      echo "Redis is running!"

      echo "Resetting MariaDB Data"
      # Delete Maria Folders
      echo "Delete maria Folders"
      rm -fR $(pwd)/nix/docker/maria/mariadb_data

      # Create Maria Folders
      echo "Create maria Folders"
      mkdir $(pwd)/nix/docker/maria/mariadb_data

      echo "Starting Pyrodactyl"
      bash ./nix/buildsteps.sh
      # Define cleanup function to stop services

      cleanup() {
        echo "Stopping Redis..."
        pkill redis-server

        echo "Stopping mariadb-docker..."
        docker-compose --project-directory ./nix/docker/maria/ down
        echo "Stopping Pterodactyl wings..."
        docker-compose --project-directory ./nix/docker/wings/ down
        }

      # Register cleanup on shell exit
      trap cleanup EXIT
    '';
};
});
}

