import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ScrollMenu } from '@/components/elements/ScrollMenu';
import Checkbox from '@/components/elements/inputs/Checkbox';

import { apiEndpoints, fetchHeaders, gameLoaders, settings } from './config';
import { fetchNewProjects } from './config';

interface GameVersion {
    version: string;
    version_type: 'release' | 'snapshot';
}

interface Props {
    appVersion: string;
    baseUrl: string;
}

const GameVersionSelector: React.FC<Props> = ({ appVersion, baseUrl }) => {
    const [minecraftVersions, setMinecraftVersions] = useState<GameVersion[]>([]);
    const [isSnapshotSelected, setIsSnapshotSelected] = useState<boolean>(false);
    const apiUrl = `${baseUrl}${apiEndpoints.versions}`;

    useEffect(() => {
        async function fetchGameVersions() {
            try {
                const response = await fetch(apiUrl, {
                    headers: fetchHeaders(appVersion),
                });

                const data = await response.json();
                setMinecraftVersions(data);
            } catch (error) {
                toast.error('Failed to fetch Minecraft versions.');
                console.error(error);
            }
        }

        if (appVersion) {
            fetchGameVersions();
        }
    }, [appVersion]);

    const filteredVersions = minecraftVersions.filter((version) => {
        if (isSnapshotSelected) {
            return version.version_type === 'snapshot';
        } else {
            return version.version_type !== 'snapshot';
        }
    });

    const handleSelectionChange = (selectedItems: string[]) => {
        settings.versions = selectedItems;
        console.log('Updated settings.versions:', settings.versions);
    };

    return (
        <div>
            {filteredVersions.length > 0 ? (
                <ScrollMenu
                    items={filteredVersions.map((version) => version.version)}
                    onSelectionChange={handleSelectionChange}
                />
            ) : (
                <p>No versions available...</p>
            )}
            {filteredVersions.length > 0 ? (
                <div className='mb-4'>
                    <Checkbox
                        label='Show Snapshots'
                        checked={isSnapshotSelected}
                        onChange={() => setIsSnapshotSelected((prev) => !prev)}
                        onClick={fetchNewProjects()}
                    />
                </div>
            ) : (
                <p></p>
            )}
        </div>
    );
};

export default GameVersionSelector;
