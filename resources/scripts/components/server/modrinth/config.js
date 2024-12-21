export const gameLoaders = [];
export const gamerVersions = [];

export const offset = 0;

export const apiEndpoints = {
    projects: `/search?offset=${offset}`,
    loaders: '/tag/loader',
    versions: `/tag/game_version`,
};

export const settings = {
    loaders: [''],
    versions: [''],
};

export const fetchHeaders = (appVersion) => ({
    'Content-Type': 'application/json',
    'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
});
