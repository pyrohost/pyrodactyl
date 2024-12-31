import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import EnvironmentSelector from './EnvironmentSelector';
import { apiEndpoints, fetchNewProjects, settings } from './config';

interface GameLoaders {
    icon: string; // SVG data (probably won't use this)
    name: string;
    supported_project_types: string[];
}

interface Props {
    appVersion: string;
    baseUrl: string;
}

//! FIXME: We only want to show actual loaders like Fabric, Paper, Forge, not datapacks, Iris, Optifine
const LoaderSelector: React.FC<Props> = ({ appVersion, baseUrl }) => {
    const [loaders, setLoaders] = useState<GameLoaders[]>([]);
    const apiUrl = `${baseUrl}${apiEndpoints.loaders}`;

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
                    toast(`HTTP Error! Status: ${response.status}`);
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
        }
    }, [appVersion]);

    const handleSelectionChange = (selectedItems: string[]) => {
        settings.loaders = selectedItems;
        // fetchProjectsGlobal(baseUrl, appVersion);
        console.log('Selected loaders updated:', selectedItems);
    };

    const filterLoaders = loaders.filter(
        (loader) => loader.supported_project_types.includes('mod') || loader.supported_project_types.includes('plugin'),
    );

    return (
        <div onClick={fetchNewProjects()}>
            {filterLoaders.length > 0 ? (
                <EnvironmentSelector
                    items={filterLoaders.map((loader) => loader.name)}
                    onSelectionChange={handleSelectionChange}
                />
            ) : (
                <p>No Loaders available...</p>
            )}
        </div>
    );
};

export default LoaderSelector;