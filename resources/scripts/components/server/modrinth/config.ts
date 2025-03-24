interface Settings {
    loaders: any[];
    versions: any[];
    environments: any[];
    searchTerms: string;
}

export const persistent = {
    gameLoaders: [],
    gameVersions: [],
};

export const offset = 0;
export const perpage = 25;

export const apiEndpoints = {
    projects: `/search`,
    loaders: '/tag/loader',
    versions: `/tag/game_version`,
};

export const settings: Settings = {
    loaders: [],
    versions: [],
    environments: [],
    searchTerms: '',
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
