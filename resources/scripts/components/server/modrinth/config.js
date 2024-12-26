export const gameLoaders = [];
export const gamerVersions = [];

export const offset = 0;

export const apiEndpoints = {
    projects: `/search`,
    loaders: '/tag/loader',
    versions: `/tag/game_version`,
};

export const settings = {
    loaders: [],
    versions: [],
    environments: [],
};

export const fetchHeaders = (appVersion) => ({
    'Content-Type': 'application/json',
    'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
});
