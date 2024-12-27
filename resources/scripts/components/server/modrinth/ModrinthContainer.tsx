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
        // settings.searchTerms = setSearchTerm;
        // settings.searchTerms = setSearchTerm;
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
                const response = await fetch('/api/client/version');
                const data = await response.json();
                setAppVersion(data.version); // Set the app version state
            } catch (error) {
                toast.error('Failed to fetch app version.');
            }
        }
        getAppVersion();
    }, []);

    // console.log(settings.searchTerms);

    useEffect(() => {
        setSearchTerm('');
    }, [location]);

    if (!appVersion) {
        return <div>Loading...</div>;
    }

    // Function to update settings
    const updateSettings = (key: keyof typeof settings, value: any) => {
        setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
    };

    const handleSearch = () => {
        toast.success(`Searching for: ${searchQuery}`);
        console.log(searchQuery);
    };

    return (
        <PageContentBlock title={'Mods/Plugins'}>
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
                    <input
                        className='pl-14 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold mb-4'
                        type='text'
                        placeholder='Search'
                        onChange={(event) => debouncedSearchTerm(event.target.value)}
                        // onChange={(event) => console.log(event.target.value)}
                    />

                    <ProjectSelector appVersion={appVersion} baseUrl={url} nonApiUrl={nonApiUrl} />
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
