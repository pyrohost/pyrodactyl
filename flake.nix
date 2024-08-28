{
  description = "PyroPanel";

  inputs = {
    flake-utils = {
      url = "github:numtide/flake-utils";
    };

    mk-node-package = {
      url = "github:winston0410/mkNodePackage";
      inputs = {
        flake-utils.follows = "flake-utils";
        nixpkgs.follows = "nixpkgs";
      };
    };

    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixos-unstable";
    };
  };

  outputs = { self, flake-utils, mk-node-package, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs { inherit system; };
      mkNodePackage = mk-node-package.lib."${system}".mkNodePackage;

      php = pkgs.php; # PHP 8.2
      phpPackages = pkgs.phpPackages; # PHP 8.2

      php81WithExtensions = php.buildEnv {
        extensions = {
          enabled,
          all,
        }:
          enabled
          ++ (with all; [
            redis
            xdebug
          ]);
        extraConfig = ''
          xdebug.mode=debug
        '';
      };

      composer = phpPackages.composer.override { php = php81WithExtensions; };

      caCertificates = pkgs.runCommand "ca-certificates" {} ''
        mkdir -p $out/etc/ssl/certs $out/etc/pki/tls/certs
        ln -s ${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt $out/etc/ssl/certs/ca-bundle.crt
        ln -s ${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt $out/etc/ssl/certs/ca-certificates.crt
        ln -s ${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt $out/etc/pki/tls/certs/ca-bundle.crt
      '';

      caddyfile = pkgs.writeText "Caddyfile" ''
        :80 {
          root * /var/www/html/public/
          file_server

          header {
            -Server
            -X-Powered-By
            Referrer-Policy "same-origin"
            X-Frame-Options "deny"
            X-XSS-Protection "1; mode=block"
            X-Content-Type-Options "nosniff"
          }

          encode gzip zstd

          php_fastcgi localhost:9000

          try_files {path} {path}/ /index.php?{query}
        }
      '';

      phpfpmConf = pkgs.writeText "php-fpm.conf" ''
        [global]
        error_log = /dev/stderr
        daemonize = no

        [www]
        user  = nobody
        group = nobody

        listen = 0.0.0.0:9000

        pm                      = dynamic
        pm.start_servers        = 4
        pm.min_spare_servers    = 4
        pm.max_spare_servers    = 16
        pm.max_children         = 64
        pm.max_requests         = 256

        clear_env = no
        catch_workers_output = yes

        decorate_workers_output = no
      '';

      configs = pkgs.runCommand "configs" {} ''
        mkdir -p $out/etc/caddy
        ln -s ${caddyfile} $out/etc/caddy/Caddyfile
        ln -s ${phpfpmConf} $out/etc/php-fpm.conf
      '';

      src = with pkgs.lib;
        cleanSource (cleanSourceWith {
          filter = name: type: let
            baseName = baseNameOf (toString name);
          in
            !(builtins.elem baseName [
              ".direnv"
              ".github"
              "bootstrap/cache"
              "node_modules"
              "public/build"
              "public/hot"
              "storage"
              "vendor"
              ".editorconfig"
              ".env"
              ".env.testing"
              ".envrc"
              ".gitignore"
              ".php-cs-fixer.cache"
              ".phpunit.result.cache"
              "BUILDING.md"
              "CODE_OF_CONDUCT.md"
              "CONTRIBUTING.md"
              "docker-compose.development.yaml"
              "docker-compose.example.yaml"
              "docker-compose.yaml"
              "flake.lock"
              "flake.nix"
              "shell.nix"
            ]);
          src = ./.;
        });

      version = "latest";

      ui = mkNodePackage {
        inherit src version;

        pname = "pyropanel";
        buildInputs = [];

        buildPhase = ''
          yarn run build:production
        '';

        installPhase = ''
          mkdir -p $out
          cp -r public/build $out
        '';
      };

      panel = pkgs.stdenv.mkDerivation {
        inherit src version;

        pname = "pyropanel";
        buildInputs = [ui];

        installPhase = ''
          mkdir -p $out/public/build
          cp -r ${ui}/build/* $out/public/build
        '';
      };
    in {
      defaultPackage = panel;
      devShell = import ./shell.nix { inherit pkgs; };

      packages = {
        inherit panel;

        # Development Environment Package
        development = pkgs.buildEnv {
          name = "pyropanel-development";
          paths = [
            pkgs.bash
            caCertificates
            pkgs.caddy
            composer
            configs
            pkgs.coreutils
            pkgs.mysql80
            pkgs.nodejs_18
            pkgs.nodePackages.yarn
            php81WithExtensions
          ];
          pathsToLink = ["/bin" "/etc"];
        };
      };
    }
  );
}

