// TODO: Make another page/component to open the mod on pyrodactyl and show all compatible versions for the current mod
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';

import { Checkbox } from '@/components/elements/CheckboxLabel';
import ContentBox from '@/components/elements/ContentBox';
import { ModBox } from '@/components/elements/ModBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import ProjectSelector from './DisplayMods';
import EnvironmentSelector from './EnvironmentSelector';
import GameVersionSelector from './GameVersionSelector';
import LoaderSelector from './LoaderSelector';
import { apiEndpoints, fetchHeaders, gameLoaders } from './config';

export default () => {
    console.log(apiEndpoints.projects);
    const environment = ['Client', 'Server'];
    const headers: Headers = new Headers();
    const url = 'https://staging-api.modrinth.com/v2';
    const nonApiUrl = 'https://staging.modrinth.com';
    async function getAppVersion(): Promise<string> {
        const response = await fetch('/api/client/version');
        const data = await response.json();
        return data.version;
    }

    const appVersion = getAppVersion();

    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'pyrohost/pyrodactyl/' + appVersion + ' (pyro.host)');

    return (
        <PageContentBlock title={'Mods/Plugins'}>
            <div className='flex justify-center items-center  w-full'>
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
                            <LoaderSelector appVersion={appVersion} baseUrl={url} />
                        </ContentBox>
                    </ModBox>

                    <ModBox>
                        <ContentBox title='Version' className='scrollbar-thumb-red-700 '>
                            <GameVersionSelector appVersion={appVersion} baseUrl={url} />
                        </ContentBox>
                    </ModBox>
                    <ModBox>
                        <ContentBox title='Environment' className=''>
                            <EnvironmentSelector items={environment}></EnvironmentSelector>
                        </ContentBox>
                    </ModBox>
                </ContentBox>
                <ContentBox
                    className='p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl w-full md:w-4/5'
                    title='Modrinth'
                >
                    <ProjectSelector appVersion={appVersion} baseUrl={url} nonApiUrl={nonApiUrl}></ProjectSelector>
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
