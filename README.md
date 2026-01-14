<p align="center">
    <img src="https://i.imgur.com/R10ivg9.png" alt="Banner with Pyrodactyl Logo">
</p>

<p align="center">
 <a aria-label="Made by Pyro Inc." href="https://pyro.host"><img src="https://i.imgur.com/uvIy6cI.png"></a>
 <a aria-label="Join the Pyrodactyl community on Discord" href="https://discord.gg/UhuYKKK2uM?utm_source=githubreadme&utm_medium=readme&utm_campaign=OSSLAUNCH&utm_id=OSSLAUNCH"><img alt="" src="https://i.imgur.com/qSfKisV.png"></a>
</p>

<p align="center">
  <a href="https://github.com/pyrodactyl-oss/pyrodactyl/actions/workflows/dev-build.yaml">
    <img src="https://github.com/pyrodactyl-oss/pyrodactyl/actions/workflows/dev-build.yaml/badge.svg" alt="Docker">
  </a>
</p>

<h1 align="center">Pyrodactyl</h1>

> [!WARNING]
> Pyrodactyl is under development and pre-release. Some UI elements may appear broken, and there might be some bugs.

> [!NOTE]
> Please read our documentation at [https://pyrodactyl.dev](https://pyrodactyl.dev/docs/pyrodactyl) before installing.

> [!IMPORTANT]
> For Pyrodactyl-specific issues, please use the [Pyrodactyl Discord](https://discord.gg/UhuYKKK2uM?utm_source=githubreadme&utm_medium=readme&utm_campaign=OSSLAUNCH&utm_id=OSSLAUNCH) instead of Pterodactyl or Pelican support channels.

Pyrodactyl is the Pterodactyl-based game server management panel that focuses on performance enhancements, a reimagined, accessible interface, and top-tier developer experience. Builds faster, compiles smaller: Pyrodactyl is the world's best Pterodactyl.

[![Dashboard Image](./.github/server-menu.png)](https://panel.pyro.host)

## Changes from vanilla Pterodactyl

- **Smaller bundle sizes:** Pyrodactyl is built using Vite, and significant design changes mean Pyrodactyl's initial download size is over **[170 times smaller than leading Pterodactyl forks, including Pelican](https://i.imgur.com/tKWLHhR.png)**.
- **Faster build times:** Pyrodactyl completes builds in milliseconds with the power of Turbo. Cold builds with zero cache finish in **under 7 seconds**.
- **Faster loading times:** Pyrodactyl's load times are, on average, **[over 16 times faster](https://i.imgur.com/28XxmMi.png)** than other closed-source Pterodactyl forks and Pelican. Smarter code splitting and chunking means that pages you visit in the panel only load necessary resources on demand. Better caching means that everything is simply _snappy_.
- **More secure:** Pyrodactyl's modern architecture means **most severe and easily exploitable CVEs simply do not exist**. We have also implemented SRI and integrity checks for production builds.
- **More accessible:** Pyro believes that gaming should be easily available for everyone. Pyrodactyl builds with the latest Web accessibility guidelines in mind. Pyrodactyl is **entirely keyboard-navigable, even context menus**, and screen-readers are easily compatible.
- **More approachable:** Pyrodactyl's friendly, approachable interface means that anyone can confidently run a game server.

![Dashboard Image](https://i.imgur.com/kHHOW6P.jpeg)

## Installing Pyrodactyl

See our [Installation](https://pyrodactyl.dev/docs/pyrodactyl/installation) docs page on how to get started.

> [!NOTE]
> Windows is currently only supported for development purposes.

## Local Development

Pyrodactyl has various effortless ways of starting up a ready-to-use, fully-featured development environment. See our [Local Development](https://pyrodactyl.dev/docs/pyrodactyl/local-development) documentation for more information.

## Star History

<a href="https://star-history.com/#pyrodactyl-oss/pyrodactyl&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=pyrohost/pyrodactyl&type=Date" />
  </picture>
</a>

## License

Pterodactyl® Copyright © 2015 - 2022 Dane Everitt and contributors.

Pyrodactyl™ Copyright © 2023-Present Pyro Inc. and contributors.

Apache-2.0
