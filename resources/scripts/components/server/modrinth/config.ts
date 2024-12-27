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

// Function to programmatically click the button with id 'fetchNewProjects'
export const fetchNewProjects = () => {
    const button = document.getElementById('fetchNewProjects');
    if (button) {
        button.click();
    }
};
