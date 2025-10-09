import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import EnvironmentSelector from './EnvironmentSelector';
import { apiEndpoints, fetchNewProjects, settings } from './config';

interface GameLoaders {
    icon: string;
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
                const { data } = await axios.get(apiUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': `pyrohost/pyrodactyl/${appVersion} (pyro.host)`,
                    },
                });

                setLoaders(data);
            } catch (error: any) {
                if (error.response) {
                    toast(`Error de HTTP: ${error.response.status}`);
                } else {
                    toast.error('No se han podido obtener los cargadores.');
                }
                console.error(error);
            }
        }

        if (appVersion) {
            fetchLoaders();
        }
    }, [appVersion]);

    const handleSelectionChange = (selectedItems: string[]) => {
        settings.loaders = selectedItems;
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
                <p>No hay cargadores disponibles...</p>
            )}
        </div>
    );
};

export default LoaderSelector;
