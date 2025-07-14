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
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Backups</h1>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <MainPageHeader title={'Backups'}>
                <Can action={'backup.create'}>
                    <div className={`flex flex-col sm:flex-row items-center justify-end`}>
                        {backupLimit > 0 && backups.backupCount > 0 && (
                            <p className={`text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0 text-right`}>
                                {backups.backupCount} of {backupLimit} backups
                            </p>
                        )}
                        {backupLimit > 0 && backupLimit > backups.backupCount && <CreateBackupButton />}
                    </div>
                </Can>
            </MainPageHeader>
            <FlashMessageRender byKey={'backups'} />
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        // Don't show any error messages if the server has no backups and the user cannot
                        // create additional ones for the server.
                        !backupLimit ? null : (
                            <p className={`text-center text-sm text-zinc-300`}>
                                {page > 1
                                    ? "Looks like we've run out of backups to show you, try going back a page."
                                    : 'Your server does not have any backups.'}
                            </p>
                        )
                    ) : (
                        <PageListContainer>
                            {items.map((backup) => (
                                <BackupRow key={backup.uuid} backup={backup} />
                            ))}
                        </PageListContainer>
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p className={`text-center text-sm text-zinc-300`}>Backups cannot be created for this server.</p>
            )}
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
