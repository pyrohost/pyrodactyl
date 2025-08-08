import { useContext, useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { PageListContainer } from '@/components/elements/pages/PageList';
import BackupRow from '@/components/server/backups/BackupRow';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';

import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return (
            <ServerContentBlock title={'Backups'}>
                <FlashMessageRender byKey={'backups'} />
                <MainPageHeader title={'Backups'} />
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <FlashMessageRender byKey={'backups'} />
            <MainPageHeader title={'Backups'}>
                <Can action={'backup.create'}>
                    <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                        {backupLimit > 0 && backups.backupCount > 0 && (
                            <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                {backups.backupCount} of {backupLimit} backups
                            </p>
                        )}
                        {backupLimit > 0 && backupLimit > backups.backupCount && <CreateBackupButton />}
                    </div>
                </Can>
            </MainPageHeader>

            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        <div className='flex flex-col items-center justify-center py-12 px-4'>
                            <div className='text-center'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                    <svg className='w-8 h-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path
                                            fillRule='evenodd'
                                            d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </div>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                    {backupLimit > 0 ? 'No backups found' : 'Backups unavailable'}
                                </h3>
                                <p className='text-sm text-zinc-400 max-w-sm'>
                                    {backupLimit > 0
                                        ? 'Your server does not have any backups. Create one to get started.'
                                        : 'Backups cannot be created for this server.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <PageListContainer>
                            {items.map((backup) => (
                                <BackupRow key={backup.uuid} backup={backup} />
                            ))}
                        </PageListContainer>
                    )
                }
            </Pagination>
        </ServerContentBlock>
    );
};

const BackupContainerWrapper = () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};

export default BackupContainerWrapper;
