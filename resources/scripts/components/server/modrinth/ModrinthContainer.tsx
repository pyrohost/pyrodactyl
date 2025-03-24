import axios from 'axios';
import debounce from 'debounce';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';
import ContentBox from '@/components/elements/ContentBox';
import { ModBox } from '@/components/elements/ModBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import { ServerContext } from '@/state/server';

import ProjectSelector from './DisplayMods';
import EnvironmentSelector from './EnvironmentSelector';
import GameVersionSelector from './GameVersionSelector';
import LoaderSelector from './LoaderSelector';
import { fetchNewProjects } from './config';
import { settings as localSettings } from './config';

export default () => {
    const [appVersion, setAppVersion] = useState<string | null>(null);

    const [settings, setSettings] = useState({
        loaders: [],
        versions: [],
        environments: [],
    });
    const [searchQuery, setSearchQuery] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const updateSearchTerms = () => {
        localSettings.searchTerms = searchTerm;
        fetchNewProjects();
        return debounce(setSearchTerm, 50);
    };
    const debouncedSearchTerm = updateSearchTerms();

    const environment = ['Client', 'Server'];
    const url = 'https://api.modrinth.com/v2';
    const nonApiUrl = 'https://modrinth.com';

    // Fetch app version
    useEffect(() => {
        async function getAppVersion() {
            try {
                const response = await axios.get('/api/client/version');
                setAppVersion(response.data.version);
            } catch (error) {
                toast.error('Failed to fetch app version.');
            }
        }
        getAppVersion();
    }, []);

    useEffect(() => {
        setSearchTerm('');
    }, [location]);

    if (!appVersion) {
        return <div>Loading...</div>;
    }

    return (
        <PageContentBlock title={'Mods/Plugins'}>
            <ContentBox className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl mb-5'>
                {/* TODO: Add a navbar to cycle between Downloaded, Download, and Dependency resolver*/}
            </ContentBox>
            <div className='flex flex-wrap gap-4'>
                <ContentBox
                    className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl md:w-1/6'
                    title='Settings'
                >
                    <Can action={'modrinth.loader'}>
                        <ModBox>
                            <ContentBox title='Loader' className=''>
                                <LoaderSelector
                                    appVersion={appVersion}
                                    baseUrl={url}
                                    // onSelectionChange={(selectedLoaders) => updateSettings('loaders', selectedLoaders)}
                                />
                            </ContentBox>
                        </ModBox>
                    </Can>
                    <Can action={'modrinth.version'}>
                        <ModBox>
                            <ContentBox title='Version' className='scrollbar-thumb-red-700'>
                                <GameVersionSelector
                                    appVersion={appVersion}
                                    baseUrl={url}
                                    // onSelectionChange={(selectedVersions) => updateSettings('versions', selectedVersions)}
                                />
                            </ContentBox>
                        </ModBox>
                    </Can>
                    {/* TODO: Add this field that lets you choose between client and server side mods */}
                    {/* <ModBox>
                        <ContentBox title='Environment' className=''>
                            <EnvironmentSelector
                                items={environment}
                                onSelectionChange={(selectedEnvironments) =>
                                    updateSettings('environments', selectedEnvironments)
                                }
                            />
                        </ContentBox>
                    </ModBox> */}
                </ContentBox>

                <ContentBox
                    className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full md:w-4/5'
                    title='Modrinth'
                >
                    <div className='relative w-full h-full mb-4'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='w-5 h-5 absolute top-1/2 -translate-y-1/2 left-5 opacity-40'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                            />
                        </svg>
                        <input
                            className='pl-14 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold'
                            type='text'
                            placeholder='Search'
                            onChange={(event) => debouncedSearchTerm(event.target.value)}
                            // onChange={(event) => console.log(event.target.value)}
                        />
                    </div>

                    <ProjectSelector appVersion={appVersion} baseUrl={url} nonApiUrl={nonApiUrl} />
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
