import { useState } from 'react';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import useFlash from '@/plugins/useFlash';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import deleteBackup from '@/api/server/backups/deleteBackup';
import Can from '@/components/elements/Can';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { ServerContext } from '@/state/server';
import Input from '@/components/elements/Input';
import { restoreServerBackup } from '@/api/server/backups';
import http, { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';

import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';

interface Props {
    backup: ServerBackup;
}

export default ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [truncate, setTruncate] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('backups');
        deleteBackup(uuid, backup.uuid)
            .then(
                async () =>
                    await mutate(
                        (data) => ({
                            ...data!,
                            items: data!.items.filter((b) => b.uuid !== backup.uuid),
                            backupCount: data!.backupCount - 1,
                        }),
                        false,
                    ),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
                setLoading(false);
                setModal('');
            });
    };
    const doRestorationAction = () => {
        setLoading(true);
        clearFlashes('backups');
        restoreServerBackup(uuid, backup.uuid, truncate)
            .then(() =>
                setServerFromState((s) => ({
                    ...s,
                    status: 'restoring_backup',
                })),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false))
            .then(() => setModal(''));
    };

    const onLockToggle = () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        http.post(`/api/client/servers/${uuid}/backups/${backup.uuid}/lock`)
            .then(
                async () =>
                    await mutate(
                        (data) => ({
                            ...data!,
                            items: data!.items.map((b) =>
                                b.uuid !== backup.uuid
                                    ? b
                                    : {
                                          ...b,
                                          isLocked: !b.isLocked,
                                      },
                            ),
                        }),
                        false,
                    ),
            )
            .catch((error) => alert(httpErrorToHuman(error)))
            .then(() => setModal(''));
    };

    return (
        <>
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={`Unlock "${backup.name}"`}
                onConfirmed={onLockToggle}
            >
                This backup will no longer be protected from automated or accidental deletions.
            </Dialog.Confirm>
            <Dialog.Confirm
                open={modal === 'restore'}
                onClose={() => setModal('')}
                confirm={'Restore'}
                title={`Restore "${backup.name}"`}
                onConfirmed={() => doRestorationAction()}
            >
                <p>
                    Your server will be stopped. You will not be able to control the power state, access the file
                    manager, or create additional backups until completed.
                </p>
                <p className={`mt-4 -mb-2 bg-zinc-700 p-3 rounded`}>
                    <label htmlFor={'restore_truncate'} className={`text-base flex items-center cursor-pointer`}>
                        <Input
                            type={'checkbox'}
                            id={'restore_truncate'}
                            value={'true'}
                            checked={truncate}
                            onChange={() => setTruncate((s) => !s)}
                        />
                        Delete all files before restoring backup.
                    </label>
                </p>
            </Dialog.Confirm>
            <Dialog.Confirm
                title={`Delete "${backup.name}"`}
                confirm={'Continue'}
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
            >
                This is a permanent operation. The backup cannot be recovered once deleted.
            </Dialog.Confirm>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <ContextMenuContent className='flex flex-col gap-1'>
                    <Can action={'backup.download'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                            <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                            Download Backup
                        </ContextMenuItem>
                    </Can>
                    <Can action={'backup.restore'}>
                        <ContextMenuItem className='flex gap-2' onSelect={() => setModal('restore')}>
                            <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                            Restore Backup
                        </ContextMenuItem>
                    </Can>
                    <Can action={'backup.delete'}>
                        <>
                            <ContextMenuItem className='flex gap-2' onClick={onLockToggle}>
                                <HugeIconsFileSecurity className='!h-4 !w-4' fill='currentColor' />
                                {backup.isLocked ? 'Unlock' : 'Lock'}
                            </ContextMenuItem>
                            {!backup.isLocked && (
                                <ContextMenuItem className='flex gap-2' onSelect={() => setModal('delete')}>
                                    <HugeIconsDelete className='!h-4 !w-4' fill='currentColor' />
                                    Delete Backup
                                </ContextMenuItem>
                            )}
                        </>
                    </Can>
                </ContextMenuContent>
            ) : (
                <button
                    onClick={() => setModal('delete')}
                    className={`text-zinc-200 transition-colors duration-150 hover:text-zinc-100 p-2`}
                >
                    Delete Backup
                </button>
            )}
        </>
    );
};
