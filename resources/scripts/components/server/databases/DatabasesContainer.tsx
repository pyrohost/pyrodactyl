import { For } from 'million/react';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import CreateDatabaseButton from '@/components/server/databases/CreateDatabaseButton';
import DatabaseRow from '@/components/server/databases/DatabaseRow';

import { httpErrorToHuman } from '@/api/http';
import getServerDatabases from '@/api/server/databases/getServerDatabases';

import { ServerContext } from '@/state/server';

import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';

export default () => {
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
                    <div className={`flex flex-col sm:flex-row items-center justify-end`}>
                        {databaseLimit > 0 && databases.length > 0 && (
                            <p className={`text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0 text-right`}>
                                {databases.length} of {databaseLimit} databases
                            </p>
                        )}
                        {databaseLimit > 0 && databaseLimit !== databases.length && <CreateDatabaseButton />}
                    </div>
                </Can>
            </MainPageHeader>

            {!databases.length && loading ? null : (
                <>
                    {databases.length > 0 ? (
                        <div
                            data-pyro-databases
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                            }}
                            className='p-1 border-[1px] border-[#ffffff12] rounded-xl'
                        >
                            <div className='flex h-full w-full flex-col gap-1 overflow-hidden rounded-lg'>
                                <For each={databases} memo>
                                    {(database, index) => (
                                        <div
                                            key={index}
                                            className='flex items-center rounded-md bg-[#ffffff11] px-2 sm:px-6 py-4 transition duration-100 hover:bg-[#ffffff19] hover:duration-0 gap-4 flex-col sm:flex-row'
                                        >
                                            <DatabaseRow key={database.id} database={database} />
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    ) : (
                        <p className={`text-center text-sm text-zinc-300`}>
                            {databaseLimit > 0
                                ? 'Your server does not have any databases.'
                                : 'Databases cannot be created for this server.'}
                        </p>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};
