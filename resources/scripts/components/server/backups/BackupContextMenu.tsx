import { useState, useEffect } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';

import http, { httpErrorToHuman } from '@/api/http';
import { restoreServerBackup } from '@/api/server/backups';
import deleteBackup from '@/api/server/backups/deleteBackup';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    backup: ServerBackup;
}

const BackupContextMenu = ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
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
        restoreServerBackup(uuid, backup.uuid)
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

    // Countdown effect for restore modal
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (modal === 'restore' && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modal, countdown]);

    // Reset countdown when modal opens
    useEffect(() => {
        if (modal === 'restore') {
            setCountdown(5);
        }
    }, [modal]);

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
            <Dialog
                open={modal === 'restore'}
                onClose={() => setModal('')}
                title="Restore Backup"
            >
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <p className='text-sm font-medium text-zinc-200'>"{backup.name}"</p>
                        <p className='text-sm text-zinc-400'>
                            Your server will be stopped during the restoration process. You will not be able to control the power state, access the file manager, or create additional backups until completed.
                        </p>
                    </div>
                    
                    <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <div className='flex items-start space-x-3'>
                            <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
                            <div className='space-y-1'>
                                <h4 className='text-sm text-red-200 font-medium'>
                                    Destructive Action - Complete Server Restore
                                </h4>
                                <p className='text-xs text-red-300'>
                                    All current files and server configuration will be deleted and replaced with the backup data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setModal('')} variant='secondary'>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        onClick={() => doRestorationAction()}
                        variant='danger'
                        disabled={countdown > 0}
                    >
                        {countdown > 0
                            ? `Delete All & Restore (${countdown}s)`
                            : 'Delete All & Restore Backup'
                        }
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
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
                <div className='flex flex-wrap gap-2'>
                    <Can action={'backup.download'}>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={doDownload}
                            disabled={loading}
                            className='flex items-center gap-2'
                        >
                            <HugeIconsFileDownload className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>Download</span>
                        </ActionButton>
                    </Can>
                    <Can action={'backup.restore'}>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={() => setModal('restore')}
                            disabled={loading}
                            className='flex items-center gap-2'
                        >
                            <HugeIconsCloudUp className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>Restore</span>
                        </ActionButton>
                    </Can>
                    <Can action={'backup.delete'}>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={onLockToggle}
                            disabled={loading}
                            className='flex items-center gap-2'
                        >
                            <HugeIconsFileSecurity className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>{backup.isLocked ? 'Unlock' : 'Lock'}</span>
                        </ActionButton>
                        {!backup.isLocked && (
                            <ActionButton
                                variant='danger'
                                size='sm'
                                onClick={() => setModal('delete')}
                                disabled={loading}
                                className='flex items-center gap-2'
                            >
                                <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                                <span className='hidden sm:inline'>Delete</span>
                            </ActionButton>
                        )}
                    </Can>
                </div>
            ) : (
                <ActionButton
                    variant='danger'
                    size='sm'
                    onClick={() => setModal('delete')}
                    disabled={loading}
                    className='flex items-center gap-2'
                >
                    <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                    <span className='hidden sm:inline'>Delete</span>
                </ActionButton>
            )}
        </>
    );
};

export default BackupContextMenu;
