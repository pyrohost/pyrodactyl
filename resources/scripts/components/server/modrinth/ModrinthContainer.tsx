import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ContentBox from '@/components/elements/ContentBox';
import { ModBox } from '@/components/elements/ModBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import ProjectSelector from './DisplayMods';
import EnvironmentSelector from './EnvironmentSelector';
import GameVersionSelector from './GameVersionSelector';
import LoaderSelector from './LoaderSelector';
import { fetchNewProjects } from './config';

export default () => {
    const [appVersion, setAppVersion] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        loaders: [],
        versions: [],
        environments: [],
    });

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

    // Ensure components only render once appVersion is available
    if (!appVersion) {
        return <div>Loading...</div>; // Wait until appVersion is fetched
    }

    // Function to update settings
    const updateSettings = (key: keyof typeof settings, value: any) => {
        setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
    };

    return (
        <PageContentBlock title={'Mods/Plugins'}>
            <div className='flex justify-center items-center w-full'>
                <ModBox>
                    <ContentBox className='text-center'>Search Bar</ContentBox>
                </ModBox>
            </div>
            <div className='flex flex-wrap gap-4'>
                <ContentBox
                    className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl md:w-1/6'
                    title='Settings'
                >
                    <ModBox>
                        <ContentBox title='Loader' className=''>
                            <LoaderSelector
                                appVersion={appVersion}
                                baseUrl={url}
                                // onSelectionChange={(selectedLoaders) => updateSettings('loaders', selectedLoaders)}
                            />
                        </ContentBox>
                    </ModBox>

                    <ModBox>
                        <ContentBox title='Version' className='scrollbar-thumb-red-700'>
                            <GameVersionSelector
                                appVersion={appVersion}
                                baseUrl={url}
                                // onSelectionChange={(selectedVersions) => updateSettings('versions', selectedVersions)}
                            />
                        </ContentBox>
                    </ModBox>

                    <ModBox>
                        <ContentBox title='Environment' className=''>
                            <EnvironmentSelector
                                items={environment}
                                onSelectionChange={(selectedEnvironments) =>
                                    updateSettings('environments', selectedEnvironments)
                                }
                            />
                        </ContentBox>
                    </ModBox>
                </ContentBox>

                <ContentBox
                    className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full md:w-4/5'
                    title='Modrinth'
                >
                    <ProjectSelector appVersion={appVersion} baseUrl={url} nonApiUrl={nonApiUrl} />
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
