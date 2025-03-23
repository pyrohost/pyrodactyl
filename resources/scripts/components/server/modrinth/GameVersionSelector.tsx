import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ScrollMenu } from '@/components/server/modrinth/ScrollMenu';
import Checkbox from '@/components/elements/inputs/Checkbox';

import { apiEndpoints, fetchHeaders, persistent, settings } from './config';

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
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const apiUrl = `${baseUrl}${apiEndpoints.versions}`;

    useEffect(() => {
        const fetchGameVersions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(apiUrl, {
                    headers: fetchHeaders(appVersion),
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch versions: ${response.statusText}`);
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    setMinecraftVersions(data);
                    persistent.gameVersions = data;
                } else {
                    throw new Error('Invalid data format received from API.');
                }
            } catch (error) {
                toast.error('Failed to fetch Minecraft versions.');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (appVersion) {
            fetchGameVersions();
        }
    }, [appVersion]);

    const filteredVersions = useMemo(() => {
        return minecraftVersions.filter((version) =>
            isSnapshotSelected ? version.version_type === 'snapshot' : version.version_type === 'release',
        );
    }, [minecraftVersions, isSnapshotSelected]);

    const handleSelectionChange = (selectedItems: string[]) => {
        settings.versions = selectedItems;
    };

    const handleSnapshotToggle = () => {
        setIsSnapshotSelected((prev) => !prev);
    };

    return (
        <div>
            {isLoading ? (
                <p>Loading versions...</p>
            ) : (
                <>
                    {filteredVersions.length > 0 ? (
                        <>
                            <ScrollMenu
                                items={filteredVersions.map((version) => version.version)}
                                onSelectionChange={handleSelectionChange}
                            />
                            <div className='mb-4'>
                                <Checkbox
                                    label='Show Snapshots'
                                    checked={isSnapshotSelected}
                                    onChange={handleSnapshotToggle}
                                />
                            </div>
                        </>
                    ) : (
                        <p>No versions found</p>
                    )}
                </>
            )}
        </div>
    );
};

export default GameVersionSelector;
