import { ChevronDownIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import Button from '../../elements/ButtonV2';

interface ApiFile {
    hashes: {
        sha512: string;
        sha1: string;
    };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
}

interface Version {
    id: string;
    project_id: string;
    author_id: string;
    featured: boolean;
    name: string;
    version_number: string;
    changelog: string;
    changelog_url: string | null;
    date_published: string;
    downloads: number;
    version_type: string;
    status: string;
    requested_status: string | null;
    files: ApiFile[];
    game_versions: string[];
    loaders: string[];
}

interface DropdownButtonProps {
    versions: Version[];
    onVersionSelect?: (version: Version) => void;
    className?: string;
}

const DropdownButton = ({ versions, onVersionSelect, className = '' }: DropdownButtonProps) => {
    const [selectedVersion, setSelectedVersion] = useState<Version>(versions[0]);
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (version: Version) => {
        setSelectedVersion(version);
        setIsOpen(false);
        onVersionSelect?.(version);
    };

    return (
        <div className={`relative flex justify-center ${className}`}>
            <div className='relative w-full max-w-md'>
                <Button
                    variant='outline'
                    className='flex items-center justify-between w-full px-4 py-2 text-left'
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup='listbox'
                    aria-expanded={isOpen}
                >
                    <span className='truncate'>Selected Version: {selectedVersion.version_number}</span>
                    <ChevronDownIcon
                        className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </Button>

                {isOpen && (
                    <div
                        className='absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg'
                        role='listbox'
                    >
                        {versions.map((version) => (
                            <div
                                key={version.id}
                                role='option'
                                aria-selected={version.id === selectedVersion.id}
                                className={`px-4 py-2 cursor-pointer transition-colors ${
                                    version.id === selectedVersion.id ? 'bg-brand text-white' : 'hover:bg-gray-700'
                                }`}
                                onClick={() => handleSelect(version)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleSelect(version);
                                    }
                                }}
                                tabIndex={0}
                            >
                                <div className='flex justify-between items-center'>
                                    <span className='font-medium'>{version.version_number}</span>
                                    <span className='text-xs text-gray-400'>
                                        {new Date(version.date_published).toLocaleDateString()}
                                    </span>
                                </div>
                                {version.name && <div className='text-sm text-gray-300 truncate'>{version.name}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DropdownButton;
