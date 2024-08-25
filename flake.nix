{
  description = "Development environment for Pyrodactyl Panel";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages.${system}.default = pkgs.stdenv.mkDerivation {
        pname = "Pyrodactyl-Panel";
        version = "4.0.0-dev";

        src = ./.;

        buildInputs = [
          pkgs.php
          pkgs.php83Packages.composer
          pkgs.php82Extensions.tokenizer
          pkgs.nodejs_20
          pkgs.mariadb_110
          pkgs.redis
          pkgs.nginx
          pkgs.docker
          pkgs.docker-compose
          pkgs.openssl
        ];

        buildPhase = ''
          set -x
          echo "Build system doesn't work Yet!"
        '';

        installPhase = ''
          mkdir -p $out
          cp -r * $out/
        '';

        preInstall = ''
          npm i -g pnpm
          pnpm add -g pnpm
          pnpm i -g turbo
          composer install --no-dev --optimize-autoloader
          npm run ship
        '';
      };

      devShells.${system} = pkgs.mkShell {
        buildInputs = [
          pkgs.neovim
          pkgs.php
          pkgs.php83Packages.composer
          pkgs.php82Extensions.tokenizer
          pkgs.nodejs_20
          pkgs.mariadb_110
          pkgs.redis
          pkgs.nginx
          pkgs.docker
          pkgs.docker-compose
          pkgs.openssl
        ];

        shellHook = ''
          echo "Welcome to the development environment for Pyrodactyl Panel!"
        '';
      };

      apps.${system}.default = {
        type = "app";
        program = "${pkgs.nodejs_20}/bin/npm";
        args = [ "run ship" ];
      };
    };
}

