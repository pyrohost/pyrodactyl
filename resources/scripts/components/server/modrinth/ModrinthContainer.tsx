import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';

import Button from '@/components/elements/ButtonV2';
import { Checkbox } from '@/components/elements/CheckboxLabel';
import ContentBox from '@/components/elements/ContentBox';
import { ModBox } from '@/components/elements/ModBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ScrollMenu } from '@/components/elements/ScrollMenu';

import ProjectSelector from './DisplayMods';
import GameVersionSelector from './GameVersionSelector';
import LoaderSelector from './LoaderSelector';

export default () => {
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
                            <Checkbox label='Client'>Client</Checkbox>
                            <Checkbox label='Server'>Server</Checkbox>
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
