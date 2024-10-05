{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.php
    pkgs.php83Packages.composer
    pkgs.mysql
    pkgs.redis
    pkgs.docker
    pkgs.systemd
    pkgs.curl
    pkgs.cron
  ];

  shellHook = ''
  composer update
  '';
}

