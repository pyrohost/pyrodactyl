# Changelog
This file is a running track of new features and fixes to each version of the panel released starting with `v4.0.0`.

This project follows [Semantic Versioning](http://semver.org) guidelines.

## V4.1.0 - 7/24/25

### Fixed
  - Certain icons not showing up on Safari
### Added 
  - Deduplicated Backups Using the new Elytra Daemon
### Removed
  - Support for Pterodactyl Wings is ending.

## V4.0.0 - 7/07/25
<Callout type="info">
v4.0.0 did not make any breaking changes. bumped to 4.0.0 from 3.0.0 to give
fresh starting point from dns_manager addon
</Callout>

### Fixed
  -  feat: bypass reinstall delay by holding shift by @imeesa in https://github.com/pyrohost/pyrodactyl/pull/346
  -  Client panel improvements by @imeesa in https://github.com/pyrohost/pyrodactyl/pull/350

### Added
  - Dns Manager
  - Cloudflare DNS manager for subdomains
  - **Egg Features:** New Service Egg Variables `subdomain_minecraft` to support Minecraft srv records
  - **Egg Features:** New Service Egg Variables `subdomain_factorio` to support Factorio srv records
  - **Egg Features:** New Service Egg Variables `subdomain_rust` to support Rust srv records
### Fixed
  - Mobile Sidebar turned into navbar to make it work better and be more navigatable

**Full Changelog**: https://github.com/pyrohost/pyrodactyl/compare/v3.0.48...v4.0.0
