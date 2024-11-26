import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ScrollMenu } from '@/components/elements/ScrollMenu';

import EnvironmentSelector from './ItemSelector';

interface GameLoaders {
    icon: string; // SVG data(I probably wont use this)
    name: string;
    supported_project_types: string[];
}

interface Props {
    appVersion;
    baseUrl: string;
}
//! FIXME: We only want to show actual loaders like Fabric, Paper, Forge, not datapacks, Iris, Optifine
const LoaderSelector: React.FC<Props> = ({ appVersion, baseUrl }) => {
    const [loaders, setLoaders] = useState<GameLoaders[]>([]);
    const apiUrl = baseUrl + '/tag/loader';

    useEffect(() => {
        async function fetchLoaders() {
            try {
                const response = await fetch(apiUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                setLoaders(data);
            } catch (error) {
                toast.error('Failed to fetch game loaders.');
                console.error(error);
            }
        }

        if (appVersion) {
            fetchLoaders();
            // console.log();
        }
    }, [appVersion]);

    const filterLoaders = loaders.filter((loader) => {
        return loader.name;
    });

    return (
        <div>
            {filterLoaders.length > 0 ? (
                <EnvironmentSelector items={filterLoaders.map((loaders) => loaders.name)} />
            ) : (
                <p>No Loaders available...</p>
            )}
        </div>
    );
};

export default LoaderSelector;
