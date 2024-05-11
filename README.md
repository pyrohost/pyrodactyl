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

### Windows

It is not currently possible to run Pyrodactyl in a **production environment** on Windows due to wings being incompatible, but we are [actively working on a replacement](https://github.com/pyrohost/alerion). If you know a little Rust, we would love your help!

## Local Development on Windows

Pyrodactyl is the world's first Pterodactyl panel that can be developed and run locally (with Wings) on Windows machines through [Vagrant](https://www.vagrantup.com/). Verify you have met the prerequisites above, then follow the steps below.

1. Clone the Pyrodactyl panel repository
2. Run `npm i` to install all the packages necessary.
3. Run `pnpm ship` to build Pyrodactyl. This will cache the results of the build and upload sourcemaps to Sentry. Subsequent builds without code changes will finish in milliseconds.
4. Run `vagrant up`. This will setup wings and the necessary services in order to run Pyrodactyl's databases, services, and app. This process could take up to 15 minutes.
5. Once you receive a message that says "Pyrodactyl is now up and running at localhost:3000", visit that URL in your browser and login with the default credentials provided in your console. **It's important that you use localhost to connect to Pyrodactyl! If you use 127.0.0.1, you will run into CORS issues and other issues that will not be fixed.**
6. Visit localhost:3000/admin to provision your first server on Pyrodactyl!

### Notes about Local Development on Windows

- If you have the dev server running (`pnpm dev`), a development build of the app will be served at localhost:3000 with HMR. If you want to preview a production build of Pyrodactyl, terminate the dev server and run `pnpm ship`. Once it finishes, it will also be served at localhost:3000.

- If you're running the development server or have built a production version of Pyrodactyl, but visiting localhost:3000 hangs permanently, ensure you don't have any other apps or games open that may interfere with any of the ports in the Vagrantfile. For example, Steam may use port 8080, or another development server may be using a port used by Pyrodactyl. Run `vagrant reload` to re-point ports to your virtual machine after ensuring nothing may be using it, and try again.

- If you receive a message like `Vagrant was unable to mount VirtualBox shared folders`, you [may need to install the vbguest plugin for VirtualBox](https://stackoverflow.com/a/48569055/11537010) with `vagrant plugin install vagrant-vbguest`. If it's already installed, run `vagrant plugin update vagrant-vbguest`.

- We recommend setting up [Remote Caching via turbo](https://turbo.build/repo/docs/core-concepts/remote-caching). When you run `pnpm ship` on your local development machine, its results will be cached and uploaded, allowing you to finish a build on your production server in milliseconds.

- We do not recommend using Hyper-V as your virtualization layer. If your vagrant installation asks you for a password, this is because you used Hyper-V. The password will be your Windows password.

> [!CAUTION]
> We do not recommend installing packages via pnpm. Although it is entirely possible to run and build Pyrodactyl solely with pnpm, pnpm is incompatible with our build chunking strategy that allows Pyrodactyl to load so quickly.
