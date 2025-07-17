{
  inputs = {
    nixpkgs.url = "github:tinted-software/nixpkgs";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    {
      self,
      nixpkgs,
      systems,
      ...
    }:
    let
      eachSystem = nixpkgs.lib.genAttrs (import systems);
    in
    {
      devShells = eachSystem (
        system: with nixpkgs.legacyPackages.${system}; {
          default = mkShell {
            nativeBuildInputs = [
              nodejs_24
              nodejs_24.pkgs.pnpm
            ];
          };
        }
      );
    };
}
