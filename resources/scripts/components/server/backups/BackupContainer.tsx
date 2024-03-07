import { useContext, useEffect, useState } from 'react';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Pagination from '@/components/elements/Pagination';

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
        // return <Spinner size={'large'} centered />;
        return <></>;
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <div className={'flex flex-row justify-between items-center mb-8'}>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Backups</h1>
                <Can action={'backup.create'}>
                    <div className={`sm:flex items-center justify-end`}>
                        {backupLimit > 0 && backups.backupCount > 0 && (
                            <p className={`text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0`}>
                                {backups.backupCount} of {backupLimit} backups
                            </p>
                        )}
                        {backupLimit > 0 && backupLimit > backups.backupCount && <CreateBackupButton />}
                    </div>
                </Can>
            </div>
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
                                    : 'It looks like there are no backups currently stored for this server.'}
                            </p>
                        )
                    ) : (
                        <div
                            data-pyro-file-manager-files
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                            }}
                            className='p-1 border-[1px] border-[#ffffff12] rounded-xl'
                        >
                            <div className='w-full h-full overflow-hidden rounded-lg flex flex-col gap-1'>
                                {/* not using index */}
                                {items.map((backup, _) => (
                                    <BackupRow key={backup.uuid} backup={backup} />
                                ))}
                            </div>
                        </div>
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p className={`text-center text-sm text-zinc-300`}>
                    Backups cannot be created for this server because the backup limit is set to 0.
                </p>
            )}
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
