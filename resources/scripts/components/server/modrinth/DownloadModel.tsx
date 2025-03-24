// NOTE: This should be a middleware instead of whatever the fuck this is
import axios from 'axios';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import DropdownButton from '@/components/server/modrinth/Dropdown';

import asModal from '@/hoc/asModal';

import { ExpandableScrollBox, type ScrollItem } from './scroll-dropdown';

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
    const [selectedItem, setSelectedItem] = useState<ScrollItem | null>(null);

    const handleSelect = (item: ScrollItem) => {
        setSelectedItem(item);
        console.log(`Selected: ${item.label}`);
    };

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

    return (
        <div className='p-6 mb-12 w-full overscroll-none'>
            <h2 className='text-2xl font-bold text-white mb-4 text-center '>{modName}</h2>
            <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>

            <FlashMessageRender byKey={`mod-download-${modid}`} />
            {loading ? (
                <p className='text-white'>Loading versions...</p>
            ) : versions.length === 0 ? (
                <p className='text-white'>No versions available for this mod. 😔</p>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='w-full max-w-sm space-y-8'>
                        <h1 className='text-2xl font-bold text-center text-custom-light-gray'>
                            <span className='text-custom-red'>Selection</span> Box
                        </h1>

                        <ExpandableScrollBox
                            placeholder='Select an option'
                            items={versions}
                            maxHeight='250px'
                            onSelect={handleSelect}
                        />

                        {/* Display selected item */}
                        <div className='p-4 bg-custom-dark-gray rounded-md text-custom-light-gray text-center'>
                            {selectedItem ? `You selected: ${selectedItem.label}` : 'No option selected yet'}
                        </div>

                        <div className='text-sm text-custom-light-gray text-center mt-4 opacity-70'>
                            The selected item appears in the button after selection
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default asModal<Props>()(DownloadModModal);
