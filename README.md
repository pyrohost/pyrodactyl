# New repo incase this gets taken down https://git.denisland.ovh/denisapain/pyronocherry
## Running Pyrodactyl

### Prerequisites

- Latest LTS version of NodeJS
- Pnpm (`npm i -g pnpm`)
- Turbo (`pnpm i -g turbo`)
- Git

### Linux

Setting up Pyrodactyl is a breeze on Linux. Follow the [official Pterodactyl documentation](https://pterodactyl.io/panel/1.0/getting_started.html) for your distribution up to the point where you need to download the panel.

Instead of downloading the official panel, follow the steps below to install Pyrodactyl:

1. `git clone https://github.com/pyrohost/panel.git /var/www/pterodactyl`
2. `cd /var/www/pterodactyl`
3. `npm i`
4. `pnpm ship`

Proceed with the rest of the installation as you would with the official panel.

> [!CAUTION]
> We do not recommend installing packages via pnpm. Although it is entirely possible to run and build Pyrodactyl solely with pnpm, pnpm is incompatible with our build chunking strategy that allows Pyrodactyl to load so quickly.
