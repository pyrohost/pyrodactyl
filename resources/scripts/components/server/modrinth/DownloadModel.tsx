import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ItemContainer from '@/components/elements/ItemContainer';
import { Button } from '@/components/elements/button/index';

import asModal from '@/hoc/asModal';

interface ModVersion {
    id: string;
    version_number: string;
    date_published: string;
    downloads: number;
    files: { url: string; filename: string }[];
}

interface Props {
    modid: string;
    modName: string;
}

const DownloadModModal = ({ modid, modName }: Props) => {
    const [versions, setVersions] = useState<ModVersion[]>([]);
    const [visibleCount, setVisibleCount] = useState(5);
    const [loading, setLoading] = useState(true);

    // Fetch mod versions from Modrinth API
    useEffect(() => {
        setLoading(true);
        axios
            .get(`https://api.modrinth.com/v2/project/${modid}/version`)
            .then((response) => {
                setVersions(response.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [modid]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 5);
    };

    return (
        <div className='p-6 w-full'>
            <h2 className='text-2xl font-bold text-white mb-4'>{modName}</h2>
            <FlashMessageRender byKey={`mod-download-${modid}`} />

            {loading ? (
                <p className='text-white'>Loading versions...</p>
            ) : versions.length === 0 ? (
                <p className='text-white'>No versions available for this mod.</p>
            ) : (
                <>
                    {versions.slice(0, visibleCount).map((version) => (
                        <ItemContainer
                            key={version.id}
                            className='flex items-center justify-between py-2 border-b w-full'
                        >
                            <div className='flex flex-col text-left w-full'>
                                <span className='text-lg font-semibold text-white'>
                                    Version: {version.version_number}
                                </span>
                                <span className='text-sm text-white'>
                                    Published: {new Date(version.date_published).toLocaleDateString()}
                                </span>
                                <span className='text-sm text-white'>Downloads: {version.downloads}</span>
                            </div>
                            <Button
                                className='ml-4'
                                onClick={() => {
                                    const file = version.files[0];
                                    if (file) {
                                        window.open(file.url, '_blank');
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faDownload} className='mr-2' /> Download
                            </Button>
                        </ItemContainer>
                    ))}
                    {visibleCount < versions.length && (
                        <Button className='mt-4' onClick={handleLoadMore}>
                            Load More
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default asModal<Props>()(DownloadModModal);
