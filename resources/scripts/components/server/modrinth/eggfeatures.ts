export interface LoaderMatch {
    type: 'mod' | 'plugin';
    loader: string;
    feature: string;
    exactMatch: boolean;
}

export const parseEggFeatures = (features: string[]): LoaderMatch[] => {
    const matches: LoaderMatch[] = [];
    const allLoaders = ['forge', 'fabric', 'neoforge', 'quilt', 'paper', 'purpur', 'spigot', 'bukkit', 'pufferfish'];

    features.forEach((feature) => {
        const normalized = feature.toLowerCase().trim();

        if (normalized.match(/^(mod|plugin)\/[a-zA-Z0-9]+$/)) {
            const [type, loader] = normalized.split('/') as ['mod' | 'plugin', string];
            const matchedLoader = allLoaders.find((l) => l.toLowerCase() === loader.toLowerCase());

            if (matchedLoader) {
                matches.push({
                    type,
                    loader: matchedLoader,
                    feature,
                    exactMatch: true,
                });
            }
        }

        allLoaders.forEach((loader) => {
            if (normalized.includes(loader.toLowerCase())) {
                const type = normalized.includes('mod') ? 'mod' : 'plugin';
                matches.push({
                    type,
                    loader,
                    feature,
                    exactMatch: normalized === `${type}/${loader}`.toLowerCase(),
                });
            }
        });
    });

    return matches
        .filter(
            (match, index, self) => index === self.findIndex((m) => m.type === match.type && m.loader === match.loader),
        )
        .sort((a, b) => (b.exactMatch ? 1 : 0) - (a.exactMatch ? 1 : 0));
};

export const getAvailableLoaders = (features: string[]): string[] => {
    const matches = parseEggFeatures(features);
    return [...new Set(matches.map((match) => match.loader))];
};

export const getLoaderType = (features: string[]): 'mod' | 'plugin' | 'unknown' => {
    const matches = parseEggFeatures(features);
    const modCount = matches.filter((m) => m.type === 'mod').length;
    const pluginCount = matches.filter((m) => m.type === 'plugin').length;

    if (modCount > pluginCount) return 'mod';
    if (pluginCount > modCount) return 'plugin';
    return 'unknown';
};
