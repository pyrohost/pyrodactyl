import { For } from 'million/react';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { PageListContainer, PageListItem } from '@/components/elements/pages/PageList';
import CreateDatabaseButton from '@/components/server/databases/CreateDatabaseButton';
import DatabaseRow from '@/components/server/databases/DatabaseRow';

import { httpErrorToHuman } from '@/api/http';
import getServerDatabases from '@/api/server/databases/getServerDatabases';

import { ServerContext } from '@/state/server';

import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';

const DatabasesContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Databases'}>
            <FlashMessageRender byKey={'databases'} />
            <MainPageHeader title={'Databases'}>
                <Can action={'database.create'}>
                    <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                        {databaseLimit > 0 && databases.length > 0 && (
                            <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                {databases.length} of {databaseLimit} databases
                            </p>
                        )}
                        {databaseLimit > 0 && databaseLimit !== databases.length && <CreateDatabaseButton />}
                    </div>
                </Can>
            </MainPageHeader>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : databases.length > 0 ? (
                <PageListContainer data-pyro-databases>
                    <For each={databases} memo>
                        {(database, index) => <DatabaseRow key={database.id} database={database} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex flex-col items-center justify-center py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <svg className='w-8 h-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    fillRule='evenodd'
                                    d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {databaseLimit > 0 ? 'No databases found' : 'Databases unavailable'}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {databaseLimit > 0
                                ? 'Your server does not have any databases. Create one to get started.'
                                : 'Databases cannot be created for this server.'}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
