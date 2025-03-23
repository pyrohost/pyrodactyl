import { ChevronDownIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { useState } from 'react';

import Button from '../../elements/ButtonV2';
import { persistent, settings } from './config';

interface ApiRequest {
    game_versions: string[];
    loaders: string[];
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
    files: ApiFiles[];
}

interface ApiFiles {
    hashes: { sha512: string; sha1: string };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
}

interface Props {
    list: ApiRequest[];
}

const DropdownButton = ({ list }: Props) => {
    const [selected, setSelected] = useState(list[0]);
    const [open, setOpen] = useState(false);

    return (
        <div className='flex justify-center'>
            <div className='relative inline-flex flex-col items-center w-3/4'>
                <Button
                    className='flex items-center justify-between w-full px-4 py-2 rounded-lg overflow-show'
                    onClick={() => setOpen(!open)}
                >
                    <span className='truncate'>Selected Version: {list[0].version_number}</span>
                    <ChevronDownIcon className='w-4 h-4 ml-2' />
                </Button>
                {open && (
                    <div className='absolute mt-1 w-full bg-[#ffffff09] border rounded-sm shadow-lg text-white'>
                        {list.map((option) => (
                            <div
                                key={option.id}
                                className='px-4 my-2 cursor-pointer text-white hover:bg-gray-700'
                                onClick={() => {
                                    setSelected(option);
                                    setOpen(false);
                                }}
                            >
                                {option.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DropdownButton;
