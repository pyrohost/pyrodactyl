[![Logo Image](https://i.imgur.com/Xyyb4IJ.png)](https://panel.pyro.host)

<p align="center">
 <a aria-label="Pyro logo" href="https://pyro.host"><img src="https://i.imgur.com/uvIy6cI.png"></a>
 <a aria-label="Join the Pyro community on Discord" href="https://discord.gg/fxeRFRbhQh?utm_source=githubreadme&utm_medium=readme&utm_campaign=OSSLAUNCH&utm_id=OSSLAUNCH"><img alt="" src="https://i.imgur.com/qSfKisV.png"></a>
 <a aria-label="Licensed under Business Source License 1.1" href="https://github.com/pyrohost/legal/blob/main/licenses/PSAL.md"><img alt="" src="https://i.imgur.com/UrJMbDk.png"></a>
</p>

<h1 align="center">Pyrodactyl by Pyro Host Inc.</h1>

Pyrodactyl is the Pterodactyl-based game server management panel that focuses on performance enhancements, a reimagined, accessible interface, and top-tier developer experience. Builds faster, compiles smaller: Pyrodactyl is the world's best Pterodactyl.

> [!WARNING]
> Please be aware of the [Pyro Source Available License (PSAL)](https://github.com/pyrohost/legal/blob/main/licenses/PSAL.md) when using content in this repository. The Pyro logo, name, and portions of source code are copyrighted and/or trademarks of Pyro Host Inc.

[![Dashboard Image](https://i.imgur.com/YqfgMYs.jpeg)](https://panel.pyro.host)

## Changes from vanilla Pterodactyl

- **Smaller bundle sizes:** Pyrodactyl is built using Vite, and significant re-architecting of the application means Pyrodactyl's initial download size is over **[170 times smaller than leading Pterodactyl forks, and Pelican](https://i.imgur.com/tKWLHhR.png)**
- **Faster build times:** Pyrodactyl completes builds in milliseconds with the power of Turbo. Cold builds with zero cache finish in **under 7 seconds**.
- **Faster loading times:** Pyrodactyl's load times are, on average, **[over 16 times faster](https://i.imgur.com/28XxmMi.png)** than other closed-source Pterodactyl forks and Pelican. Smarter code splitting and chunking means that pages you visit in the panel only load necessary resources on demand. Better caching means that everything is simply _snappy_.
- **More secure:** Pyrodactyl's modern architecture means **most severe and easily exploitable CVEs simply do not exist**. We have also implemented SRI and integrity checks for production builds.
- **More accessible:** Pyro believes that gaming should be easily available for everyone. Pyrodactyl builds with the latest Web accessibility guidelines in mind. Pyrodactyl is **entirely keyboard-navigable, even context menus.**, and screen-readers are easily compatible.
- **More approachable:** Pyrodactyl's friendly, approachable interface means that anyone can confidently run a game server [with Pyro](https://pyro.host).

[![Dashboard Image](https://i.imgur.com/kHHOW6P.jpeg)](https://panel.pyro.host)

## Running Pyrodactyl

### Prerequisites

- Latest LTS version of NodeJS
- Pnpm (`npm i -g pnpm`)
- Turbo (`pnpm i -g turbo`)
- Git

### Linux

Setting up Pyrodactyl is a breeze on Linux. Follow the [official Pterodactyl documentation](https://pterodactyl.io/community/installation) for your distribution up to the point where you need to download the panel.

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

## Star History

<a href="https://star-history.com/#pyrohost/panel&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pyrohost/panel&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=pyrohost/panel&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=pyrohost/panel&type=Date" />
  </picture>
</a>

## License

Pterodactyl® Copyright © 2015 - 2022 Dane Everitt and contributors.

Pyrodactyl™ Copyright © 2024 Pyro Host Inc.

Pyrodactyl™ is licensed by Pyro Host Inc. under the [Pyro Source Available License (PSAL)](https://github.com/pyrohost/legal/blob/main/licenses/PSAL.md). Your access to and use of content in this repository is governed by the terms of the PSAL. If you don't agree to the terms of the PSAL, you are not permitted to access or use content available in this repository.
