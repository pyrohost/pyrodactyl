<p align="center">
  <a href="https://panel.pyro.host">
    <img src="https://i.imgur.com/R10ivg9.png" alt="Banner with Pyrodactyl Logo">
  </a>

</p>

<p align="center">
 <a aria-label="Made by Pyro" href="https://pyro.host"><img src="https://i.imgur.com/uvIy6cI.png"></a>
 <a aria-label="Join the Pyro community on Discord" href="https://discord.gg/fxeRFRbhQh?utm_source=githubreadme&utm_medium=readme&utm_campaign=OSSLAUNCH&utm_id=OSSLAUNCH"><img alt="" src="https://i.imgur.com/qSfKisV.png"></a>
</p>

<p align="center">
  <a href="https://github.com/pyrohost/pyrodactyl/actions/workflows/docker.yaml">
    <img src="https://github.com/pyrohost/pyrodactyl/actions/workflows/docker.yaml/badge.svg" alt="Docker">
  </a>
</p>

<h1 align="center">Pyrodactyl</h1>

> [!IMPORTANT]
> Pyrodactyl is under development and pre-release. Some UI elements may appear broken, and there might be some bugs.

Pyrodactyl is the Pterodactyl-based game server management panel that focuses on performance enhancements, a reimagined, accessible interface, and top-tier developer experience. Builds faster, compiles smaller: Pyrodactyl is the world's best Pterodactyl.

[![Dashboard Image](https://i.imgur.com/YqfgMYs.jpeg)](https://panel.pyro.host)

## Changes from vanilla Pterodactyl

-   **Smaller bundle sizes:** Pyrodactyl is built using Vite, and significant re-architecting of the application means Pyrodactyl's initial download size is over **[170 times smaller than leading Pterodactyl forks, and Pelican](https://i.imgur.com/tKWLHhR.png)**
-   **Faster build times:** Pyrodactyl completes builds in milliseconds with the power of Turbo. Cold builds with zero cache finish in **under 7 seconds**.
-   **Faster loading times:** Pyrodactyl's load times are, on average, **[over 16 times faster](https://i.imgur.com/28XxmMi.png)** than other closed-source Pterodactyl forks and Pelican. Smarter code splitting and chunking means that pages you visit in the panel only load necessary resources on demand. Better caching means that everything is simply _snappy_.
-   **More secure:** Pyrodactyl's modern architecture means **most severe and easily exploitable CVEs simply do not exist**. We have also implemented SRI and integrity checks for production builds.
-   **More accessible:** Pyro believes that gaming should be easily available for everyone. Pyrodactyl builds with the latest Web accessibility guidelines in mind. Pyrodactyl is **entirely keyboard-navigable, even context menus.**, and screen-readers are easily compatible.
-   **More approachable:** Pyrodactyl's friendly, approachable interface means that anyone can confidently run a game server [with Pyro](https://pyro.host).

[![Dashboard Image](https://i.imgur.com/kHHOW6P.jpeg)](https://panel.pyro.host)

## Running Pyrodactyl

> [!TIP]
> Pyrodactyl now [has a Docker image avaliable](https://github.com/pyrohost/pyrodactyl/pkgs/container/pyrodactyl), which for previous users of the Pterodactyl panel in Docker, should make it easy to migrate.
>
> If you want to setup Pyrodactyl in Docker from scratch, see the [`docker-compose.example.yml`](https://github.com/pyrohost/pyrodactyl/blob/main/docker-compose.example.yml).

> [!WARNING]
> Nothing is Perfect, that apply's to this panel.
> If you are migrating your data from pterodactyl, always make sure you take a backup of your pterodactyl database and other relevant data.

### Prerequisites

-   Latest LTS version of NodeJS
-   Git

### Linux
<details><summary>Running on Linux</summary>
<p>

Setting up Pyrodactyl is a breeze on Linux. Follow the [official Pterodactyl documentation](https://pterodactyl.io/panel/1.0/getting_started.html) for your distribution up to the **Download Files** step.

Instead of downloading the official panel, use the commands below to download Pyrodactyl:

```sh
# Make directories
mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl

# Download and extract panel
curl -Lo main.tar.gz https://github.com/pyrohost/pyrodactyl/archive/refs/heads/main.tar.gz
tar -xzf main.tar.gz --strip-components=1 -C /var/www/pterodactyl pyrodactyl-main/

# Permissions for caches
chmod -R 755 storage/* bootstrap/cache/

# Install dependencies & build panel
npm ci && npm run ship
```

Proceed with the rest of the installation as you would with the official panel.
</p></details>

### Windows

It is not currently possible to run Pyrodactyl in a **production environment** on Windows due to Wings being incompatible.

## Local Development

<details><summary>On Windows</summary>
<p>

Pyrodactyl is the world's first Pterodactyl panel that can be developed and run locally (with Wings) on Windows machines through [Vagrant](https://www.vagrantup.com/). Verify you have met the prerequisites above, then follow the steps below.

1. Clone the Pyrodactyl panel repository
1. Run `npm i` to install all the packages necessary.
1. Run `npm run ship` to build Pyrodactyl. This will cache the results of the build and upload sourcemaps to Sentry. Subsequent builds without code changes will finish in milliseconds.
1. Run `vagrant up`. This will setup wings and the necessary services in order to run Pyrodactyl's databases, services, and app. This process could take up to 15 minutes.
1. Once you receive a message that says "Pyrodactyl is now up and running at localhost:3000", visit that URL in your browser and login with the default credentials provided in your console. **It's important that you use localhost to connect to Pyrodactyl! If you use 127.0.0.1, you will run into CORS issues and other issues that will not be fixed.**
1. Visit https://localhost:3000/admin to provision your first server on Pyrodactyl!

### Notes about Local Development on Windows

-   If you have the dev server running (`npm run dev`), a development build of the app will be served at localhost:3000 with HMR. If you want to preview a production build of Pyrodactyl, terminate the dev server and run `npm run ship`. Once it finishes, it will also be served at localhost:3000.

-   If you're running the development server or have built a production version of Pyrodactyl, but visiting localhost:3000 hangs permanently, ensure you don't have any other apps or games open that may interfere with any of the ports in the Vagrantfile. For example, Steam may use port 8080, or another development server may be using a port used by Pyrodactyl. Run `vagrant reload` to re-point ports to your virtual machine after ensuring nothing may be using it, and try again.

-   If you receive a message like `Vagrant was unable to mount VirtualBox shared folders`, you [may need to install the vbguest plugin for VirtualBox](https://stackoverflow.com/a/48569055/11537010) with `vagrant plugin install vagrant-vbguest`. If it's already installed, run `vagrant plugin update vagrant-vbguest`.

-   We recommend setting up [Remote Caching via turbo](https://turbo.build/repo/docs/core-concepts/remote-caching). When you run `npm run ship` on your local development machine, its results will be cached and uploaded, allowing you to finish a build on your production server in milliseconds.

-   We do not recommend using Hyper-V as your virtualization layer. If your Vagrant installation asks you for a password, this is because you used Hyper-V. The password will be your Windows password.
    - We recommend using VMWare Workstation or VirtualBox instead.
</p></details>

<details><summary>On Linux</summary>
<p>

### Prerequisites

- Nix
- Docker

Local Development on Linux is A little different, because vagrant is the buggy software that it is, I couldn't get it to run properly... Anywhere, and on no Distro.
So I decided that instead of using Vagrant, I would use nix. This turned out to be a very good idea. Now, using nix the development boots faster because we aren't using
an entire vm to host a development server, it also uses way less resources, and is much easier to configure exactly how you want through the nix/buildsteps.sh file.

### How to get started

To get started, you obviously need nix on your system, and you need to configure nix to support flake files. Depending on your OS, this can vary

1. Clone the Pyrodactyl panel repository
1. run `npm i` to install all the packages necessary.
1. Run `npm run ship` to build Pyrodactyl. This will cache the results of the build and upload sourcemaps to Sentry. Subsequent builds without code changes will finish in milliseconds.
1. Run `nix develop`. This will setup wings and the necessary services in order to run Pyrodactyl's databases, services, and app. This process could take up to 15 minutes.
1. Once you receive a message that says "Pyrodactyl is now up and running at localhost:8000", visit that URL in your browser and login with the default credentials provided in your console. **It's important that you use localhost to connect to Pyrodactyl! If you use 127.0.0.1, you will run into CORS issues and other issues that will not be fixed.**
1. Visit http://localhost:8000/admin to provision your first server on Pyrodactyl!



### Notes about Local Development on Linux

Due to a slight bug or two, pterodactyl wings does not as present work properly using the nixos development environment\
This will hopefully be fixed later, but for now just be warned

</p></details>

## Star History

<a href="https://star-history.com/#pyrohost/pyrodactyl&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date" />
  </picture>
</a>

## License

Pterodactyl® Copyright © 2015 - 2022 Dane Everitt and contributors.

Pyrodactyl™ Copyright © 2024 Pyro Host Inc. and contributors.

AGPL-3.0-or-later
