import {
    ArrowDownToLine,
    Bars,
    CloudArrowUpIn,
    Pencil,
    Shield,
    TrashBin,
    TriangleExclamation,
} from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import http, { httpErrorToHuman } from '@/api/http';
import { getServerBackupDownloadUrl } from '@/api/server/backups';
import { ServerBackup } from '@/api/server/types';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

import { useUnifiedBackups } from '../useUnifiedBackups';
import { getGlobalDaemonType } from '@/api/server/getServer';

interface Props {
    backup: ServerBackup;
}

const BackupContextMenu = ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const daemonType = getGlobalDaemonType();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [newName, setNewName] = useState(backup.name);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteTotpCode, setDeleteTotpCode] = useState('');
    const [restorePassword, setRestorePassword] = useState('');
    const [restoreTotpCode, setRestoreTotpCode] = useState('');
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { deleteBackup, restoreBackup, renameBackup, toggleBackupLock, refresh } = useUnifiedBackups();
    const hasTwoFactor = useStoreState((state: ApplicationStore) => state.user.data?.useTotp || false);

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getServerBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = async () => {
        if (!deletePassword) {
            addFlash({
                key: 'backup:delete',
                type: 'error',
                message: 'Password is required to delete this backup.',
            });
            return;
        }

        if (hasTwoFactor && !deleteTotpCode) {
            addFlash({
                key: 'backup:delete',
                type: 'error',
                message: 'Two-factor authentication code is required.',
            });
            return;
        }

        setLoading(true);
        clearFlashes('backup:delete');

        try {
            await http.delete(`/api/client/servers/${daemonType}/${uuid}/backups/${backup.uuid}`, {
                data: {
                    password: deletePassword,
                    ...(hasTwoFactor ? { totp_code: deleteTotpCode } : {}),
                },
            });

            setLoading(false);
            setModal('');
            setDeletePassword('');
            setDeleteTotpCode('');

            // Refresh the backup list to reflect the deletion
            await refresh();
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:delete', error });
            setLoading(false);
        }
    };

    const doRestorationAction = async () => {
        if (!restorePassword) {
            addFlash({
                key: 'backup:restore',
                type: 'error',
                message: 'Password is required to restore this backup.',
            });
            return;
        }

        if (hasTwoFactor && !restoreTotpCode) {
            addFlash({
                key: 'backup:restore',
                type: 'error',
                message: 'Two-factor authentication code is required.',
            });
            return;
        }

        setLoading(true);
        clearFlashes('backup:restore');

        try {
            await http.post(`/api/client/servers/${daemonType}/backups/${backup.uuid}/restore`, {
                password: restorePassword,
                ...(hasTwoFactor ? { totp_code: restoreTotpCode } : {}),
            });

            // Set server status to restoring
            setServerFromState((s) => ({
                ...s,
                status: 'restoring_backup',
            }));

            setLoading(false);
            setModal('');
            setRestorePassword('');
            setRestoreTotpCode('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:restore', error });
            setLoading(false);
        }
    };

    const onLockToggle = async () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        try {
            await toggleBackupLock(backup.uuid);
            setModal('');
        } catch (error) {
            alert(httpErrorToHuman(error));
        }
    };

    const doRename = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await renameBackup(backup.uuid, newName.trim());
            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };

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

    useEffect(() => {
        if (modal === 'restore') {
            setCountdown(5);
        }
    }, [modal]);

    useEffect(() => {
        if (modal === 'rename') {
            setNewName(backup.name);
        }
    }, [modal, backup.name]);

    return (
        <>
            <Dialog open={modal === 'rename'} onClose={() => setModal('')} title='Rename Backup'>
                <div className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-zinc-200 mb-2'>Backup Name</label>
                        <input
                            type='text'
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            placeholder='Enter backup name...'
                            maxLength={191}
                        />
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setModal('')} variant='secondary'>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        onClick={doRename}
                        variant='primary'
                        disabled={!newName.trim() || newName.trim() === backup.name}
                    >
                        Rename Backup
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
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
                onClose={() => {
                    setModal('');
                    setRestorePassword('');
                    setRestoreTotpCode('');
                }}
                title='Restore Backup'
            >
                <FlashMessageRender byKey={'backup:restore'} />
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <p className='text-sm font-medium text-zinc-200'>&quot;{backup.name}&quot;</p>
                        <p className='text-sm text-zinc-400'>
                            Your server will be stopped during the restoration process. You will not be able to control
                            the power state, access the file manager, or create additional backups until completed.
                        </p>
                    </div>

                    <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <div className='flex items-start space-x-3'>
                            <TriangleExclamation
                                width={22}
                                height={22}
                                fill='currentColor'
                                className=' text-red-400 flex-shrink-0 mt-0.5'
                            />
                            <div className='space-y-1'>
                                <h4 className='text-sm text-red-200 font-medium'>
                                    Destructive Action - Complete Server Restore
                                </h4>
                                <p className='text-xs text-red-300'>
                                    All current files and server configuration will be deleted and replaced with the
                                    backup data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <div>
                            <label htmlFor='restore-password' className='block text-sm font-medium text-zinc-300 mb-1'>
                                Password
                            </label>
                            <input
                                id='restore-password'
                                type='password'
                                className='w-full px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm border border-zinc-700 focus:border-brand'
                                placeholder='Enter your password'
                                value={restorePassword}
                                onChange={(e) => setRestorePassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {hasTwoFactor && (
                            <div>
                                <label htmlFor='restore-totp' className='block text-sm font-medium text-zinc-300 mb-1'>
                                    Two-Factor Authentication Code
                                </label>
                                <input
                                    id='restore-totp'
                                    type='text'
                                    className='w-full px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm border border-zinc-700 focus:border-brand'
                                    placeholder='6-digit code'
                                    maxLength={6}
                                    value={restoreTotpCode}
                                    onChange={(e) => setRestoreTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton
                        onClick={() => {
                            setModal('');
                            setRestorePassword('');
                            setRestoreTotpCode('');
                        }}
                        variant='secondary'
                        disabled={loading}
                    >
                        Cancel
                    </ActionButton>
                    <ActionButton
                        onClick={() => doRestorationAction()}
                        variant='danger'
                        disabled={countdown > 0 || loading}
                    >
                        {loading && <Spinner size='small' />}
                        {loading
                            ? 'Restoring...'
                            : countdown > 0
                                ? `Delete All & Restore (${countdown}s)`
                                : 'Delete All & Restore Backup'}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <Dialog
                open={modal === 'delete'}
                onClose={() => {
                    setModal('');
                    setDeletePassword('');
                    setDeleteTotpCode('');
                }}
                title={`Delete "${backup.name}"`}
            >
                <FlashMessageRender byKey={'backup:delete'} />
                <div className='space-y-4'>
                    <p className='text-sm text-zinc-300'>
                        This is a permanent operation. The backup cannot be recovered once deleted.
                    </p>

                    <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <div className='flex items-start gap-3'>
                            <svg
                                className='w-5 h-5 text-red-400 mt-0.5 flex-shrink-0'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                />
                            </svg>
                            <div className='text-sm'>
                                <p className='font-medium text-red-300'>Warning</p>
                                <p className='text-red-400 mt-1'>
                                    The backup file and its snapshot will be permanently deleted.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <div>
                            <label htmlFor='delete-password' className='block text-sm font-medium text-zinc-300 mb-1'>
                                Password
                            </label>
                            <input
                                id='delete-password'
                                type='password'
                                className='w-full px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm border border-zinc-700 focus:border-brand'
                                placeholder='Enter your password'
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {hasTwoFactor && (
                            <div>
                                <label htmlFor='delete-totp' className='block text-sm font-medium text-zinc-300 mb-1'>
                                    Two-Factor Authentication Code
                                </label>
                                <input
                                    id='delete-totp'
                                    type='text'
                                    className='w-full px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm border border-zinc-700 focus:border-brand'
                                    placeholder='6-digit code'
                                    maxLength={6}
                                    value={deleteTotpCode}
                                    onChange={(e) => setDeleteTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton
                        variant='secondary'
                        onClick={() => {
                            setModal('');
                            setDeletePassword('');
                            setDeleteTotpCode('');
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </ActionButton>
                    <ActionButton variant='danger' onClick={doDeletion} disabled={loading}>
                        {loading && <Spinner size='small' />}
                        {loading ? 'Deleting...' : 'Delete Backup'}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            disabled={loading}
                            className='flex items-center justify-center w-8 h-8 p-0 hover:bg-zinc-700'
                        >
                            <div>
                                <Bars width={22} height={22} fill='currentColor' />
                            </div>
                        </ActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                        <Can action={'backup.download'}>
                            <DropdownMenuItem onClick={doDownload} className='cursor-pointer'>
                                <ArrowDownToLine width={22} height={22} className='mr-2' fill='currentColor' />
                                Download
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownMenuItem onClick={() => setModal('restore')} className='cursor-pointer'>
                                <CloudArrowUpIn width={22} height={22} className=' mr-2' fill='currentColor' />
                                Restore
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.delete'}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setModal('rename')} className='cursor-pointer'>
                                <Pencil width={22} height={22} className=' mr-2' fill='currentColor' />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onLockToggle} className='cursor-pointer'>
                                <Shield width={22} height={22} className=' mr-2' fill='currentColor' />
                                {backup.isLocked ? 'Unlock' : 'Lock'}
                            </DropdownMenuItem>
                            {!backup.isLocked && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setModal('delete')}
                                        className='cursor-pointer text-red-400 focus:text-red-300'
                                    >
                                        <TrashBin width={22} height={22} className=' mr-2' fill='currentColor' />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <ActionButton
                    variant='danger'
                    size='sm'
                    onClick={() => setModal('delete')}
                    disabled={loading}
                    className='flex items-center gap-2'
                >
                    <TrashBin width={22} height={22} fill='currentColor' />
                    <span className='hidden sm:inline'>Delete</span>
                </ActionButton>
            )}
        </>
    );
};

export default BackupContextMenu;
