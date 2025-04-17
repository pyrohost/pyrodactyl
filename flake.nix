{
  description = "Pterodactyl development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Setup script
        setupScript = pkgs.writeShellScriptBin "pterodactyl-setup" ''
          ${builtins.readFile ./nix/buildsteps.sh}

        '';
      in {
        # Development shell
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            php82
            php82Packages.composer
            nodejs_20
            redis
            mariadb
            caddy
            git
            docker
            docker-compose
            tmux
            setupScript
          ];
          LC_ALL = "C.UTF-8";
          LANG = "C.UTF-8";
          shellHook = ''
            redis-server --daemonize yes

            echo "Pterodactyl development environment ready."
            echo "Run 'pterodactyl-setup' to initialize development environment"
          '';
        };

        # Default package (runs setup)
        defaultPackage = setupScript;
      }
    );
}
