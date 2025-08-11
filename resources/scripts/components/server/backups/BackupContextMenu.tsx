import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
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
                <p className={`mt-4 -mb-2 bg-zinc-700 p-3 rounded-sm`}>
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
                <div className='flex flex-wrap gap-2'>
                    <Can action={'backup.download'}>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={doDownload}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <HugeIconsFileDownload className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>Download</span>
                        </ActionButton>
                    </Can>
                    <Can action={'backup.restore'}>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setModal('restore')}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <HugeIconsCloudUp className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>Restore</span>
                        </ActionButton>
                    </Can>
                    <Can action={'backup.delete'}>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={onLockToggle}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <HugeIconsFileSecurity className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>{backup.isLocked ? 'Unlock' : 'Lock'}</span>
                        </ActionButton>
                        {!backup.isLocked && (
                            <ActionButton
                                variant="danger"
                                size="sm"
                                onClick={() => setModal('delete')}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                                <span className='hidden sm:inline'>Delete</span>
                            </ActionButton>
                        )}
                    </Can>
                </div>
            ) : (
                <ActionButton
                    variant="danger"
                    size="sm"
                    onClick={() => setModal('delete')}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                    <span className='hidden sm:inline'>Delete</span>
                </ActionButton>
            )}
        </>
    );
};

export default BackupContextMenu;
