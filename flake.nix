{
  description = "Development environment for Pyrodactyl Panel";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages.${system}.default = pkgs.stdenv.mkDerivation {
        pname = "Pyrodactyl-Panel";
        version = "1.0.0";

        src = ./.;

        buildInputs = [
          pkgs.python310
          pkgs.docker
          pkgs.cowsay
          pkgs.lolcat

        ];

        buildPhase = ''
          echo "Building Pyrodactyl Panel..."
          # Add build commands here
        '';

        installPhase = ''
          echo "Installing Pyrodactyl Panel..."
          # Add install commands here
        '';
      };

      devShells.${system} = pkgs.mkShell {
        buildInputs = [
          pkgs.python310
          pkgs.docker
          pkgs.cowsay
          pkgs.lolcat
          # other packages
        ];

        shellHook = ''
          echo "Welcome to the development environment for Pyrodactyl Panel!" | cowsay | lolcat
        '';
      };
    };
}
