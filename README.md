[![Logo Image](https://i.imgur.com/rrp2f0j.png)](https://panel.pyro.host)

# pyrodactyl by pyro.host

pyrodactyl is the Pterodactyl-based game server management panel. Our fork focuses on performance enhancements, a reimagined, accessible interface, and top-tier developer experience. Builds faster, compiles smaller: pyrodactyl is the world's best Pterodactyl.

[![Dashboard Image](https://pyro.host/img/panel1.jpg)](https://panel.pyro.host)

## Changes from vanilla Pterodactyl

- **Smaller bundle sizes:** pyrodactyl is built using Vite, and significant re-architecting of the application means the resulting bundle size is **55 times smaller than leading, closed-source Pterodactyl forks**
- **Faster loading times:** pyrodactyl's load times are **multiple orders of magnitudes faster** than other closed-source Pterodactyl forks. Smarter code splitting and chunking means that pages you in the panel only load the resources they need.
- **More secure:** pyrodactyl's modern architecture means **most severe and easily exploitable CVEs simply do not exist**.
- **More accessible:** Pyro believes that gaming should be easily available for everyone. pyrodactyl builds with the latest Web accessibility guidelines in mind. pyrodactyl is **entirely keyboard-navigable, even context menus.**.
- **More approachable:** pyrodactyl's friendly, approachable interface means that anyone can confidently run a game server [with Pyro](https://pyro.host).

## Running Locally

pyrodactyl is the world's first Pterodactyl panel that can be developed and run locally (with Wings) on Windows machines through [Vagrant](https://www.vagrantup.com/). 

You will need a working installation of Vagrant, the latest LTS version of NodeJS, and the latest version of npm to properly run pyro. Once you have verified you have Vagrant, NodeJS, and npm installed, you can follow the steps below:
1) Clone the pyrodactyl panel repository
2) Run `npm i` to install all the packages for the website.
3) Run `npm run build` to build pyrodactyl
4) Run `vagrant up`. This will setup wings and the necessary services in order to run pyrodactyl's databases, services, and app. This process could take up to 15 minutes. 
5) Once you receive a message that says "pyrodactyl is now up and running at localhost:3000", visit that URL in your browser and login with the default credentials provided in your console. **It's important that you use localhost to connect to pyrodactyl! If you use 127.0.0.1, you will run into CORS issues and other issues that will not be fixed.**
6) Visit localhost:3000/admin to provision your first server on pyrodactyl!

## License

Pterodactyl® Copyright © 2015 - 2022 Dane Everitt and contributors.

pyrodactyl™ Copyright © 2024 pyro.host

pyrodactyl™ and its source code is licensed and distributed under Business Source License 1.1. Please see the [LICENSE](https://github.com/pyrohost/panel/blob/main/LICENSE) file for more information on your rights to use pyrodactyl.
