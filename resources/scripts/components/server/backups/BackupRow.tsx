import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import HugeIconsSquareLock from '@/components/elements/hugeicons/SquareLock';
import HugeIconsStorage from '@/components/elements/hugeicons/Storage';
import HugeIconsX from '@/components/elements/hugeicons/X';
import HugeIconsRefresh from '@/components/elements/hugeicons/Refresh';
import { PageListItem } from '@/components/elements/pages/PageList';
import { SocketEvent } from '@/components/server/events';

import { bytesToString } from '@/lib/formatters';

import { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';
import { cancelBackup, retryBackup } from '@/api/server/backups';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import useFlash from '@/plugins/useFlash';
import { useBackupStatus } from './useBackupStatus';

import BackupContextMenu from './BackupContextMenu';

interface Props {
    backup: ServerBackup;
}

const BackupRow = ({ backup }: Props) => {
    const { mutate } = getServerBackups();
    const { addFlash, clearFlashes } = useFlash();
    const { status: liveStatus } = useBackupStatus(backup.server?.uuid || '', backup, {
        enabled: backup.isInProgress,
    });

    // Use live status if available, otherwise use backup data
    const currentStatus = liveStatus || {
        job_id: backup.jobId,
        status: backup.jobStatus,
        progress: backup.jobProgress,
        message: backup.jobMessage,
        error: backup.jobError,
        can_cancel: backup.canCancel,
        can_retry: backup.canRetry,
    };

    const handleCancel = async () => {
        if (!backup.server?.uuid || !currentStatus.can_cancel) return;

        try {
            clearFlashes('backup');
            await cancelBackup(backup.server.uuid, backup.uuid);
            addFlash({
                type: 'success',
                key: 'backup',
                message: 'Backup has been cancelled.',
            });
            await mutate();
        } catch (error) {
            addFlash({
                type: 'error',
                key: 'backup',
                message: error instanceof Error ? error.message : 'Failed to cancel backup.',
            });
        }
    };

    const handleRetry = async () => {
        if (!backup.server?.uuid || !currentStatus.can_retry) return;

        try {
            clearFlashes('backup');
            await retryBackup(backup.server.uuid, backup.uuid);
            addFlash({
                type: 'success',
                key: 'backup',
                message: 'Backup is being retried.',
            });
            await mutate();
        } catch (error) {
            addFlash({
                type: 'error',
                key: 'backup',
                message: error instanceof Error ? error.message : 'Failed to retry backup.',
            });
        }
    };

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, async () => {
        try {
            await mutate();
        } catch (e) {
            console.warn(e);
        }
    });

    const getStatusIcon = () => {
        if (backup.isInProgress) {
            return <Spinner size={'small'} />;
        } else if (backup.isLocked) {
            return <HugeIconsSquareLock className='text-red-400 w-4 h-4' fill='currentColor' />;
        } else if (backup.isSuccessful) {
            return <HugeIconsStorage className='text-green-400 w-4 h-4' fill='currentColor' />;
        } else {
            return <HugeIconsStorage className='text-red-400 w-4 h-4' fill='currentColor' />;
        }
    };

    const getStatusBadge = () => {
        if (currentStatus.status === 'failed') {
            return (
                <span className='bg-red-500/20 border border-red-500/30 py-0.5 px-2 rounded text-red-300 text-xs font-medium'>
                    Failed
                </span>
            );
        } else if (currentStatus.status === 'pending') {
            return (
                <span className='bg-yellow-500/20 border border-yellow-500/30 py-0.5 px-2 rounded text-yellow-300 text-xs font-medium'>
                    Pending
                </span>
            );
        } else if (currentStatus.status === 'running') {
            return (
                <span className='bg-blue-500/20 border border-blue-500/30 py-0.5 px-2 rounded text-blue-300 text-xs font-medium'>
                    Running ({currentStatus.progress}%)
                </span>
            );
        } else if (currentStatus.status === 'cancelled') {
            return (
                <span className='bg-gray-500/20 border border-gray-500/30 py-0.5 px-2 rounded text-gray-300 text-xs font-medium'>
                    Cancelled
                </span>
            );
        }
        return null;
    };

    return (
        <PageListItem>
            <div className='flex items-center gap-4 w-full py-1'>
                <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                    {getStatusIcon()}
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                        {getStatusBadge()}
                        <h3 className='text-sm font-medium text-zinc-100 truncate'>{backup.name}</h3>
                        <span
                            className={`text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded transition-opacity ${
                                backup.isLocked ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            Locked
                        </span>
                    </div>

                    {/* Progress bar for running backups */}
                    {backup.isInProgress && (
                        <div className='mb-2'>
                            <div className='flex justify-between text-xs text-zinc-400 mb-1'>
                                <span>{currentStatus.message || 'Processing...'}</span>
                                <span>{currentStatus.progress}%</span>
                            </div>
                            <div className='w-full bg-zinc-700 rounded-full h-1.5'>
                                <div
                                    className='bg-blue-500 h-1.5 rounded-full transition-all duration-300'
                                    style={{ width: `${currentStatus.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error message for failed backups */}
                    {currentStatus.status === 'failed' && currentStatus.error && (
                        <p className='text-xs text-red-400 truncate mb-1'>{currentStatus.error}</p>
                    )}

                    {backup.checksum && <p className='text-xs text-zinc-400 font-mono truncate'>{backup.checksum}</p>}
                </div>

                {backup.completedAt !== null && backup.isSuccessful && (
                    <div className='hidden sm:block flex-shrink-0 text-right'>
                        <p className='text-xs text-zinc-500 uppercase tracking-wide'>Size</p>
                        <p className='text-sm text-zinc-300 font-medium'>{bytesToString(backup.bytes)}</p>
                    </div>
                )}

                <div className='hidden sm:block flex-shrink-0 text-right min-w-[120px]'>
                    <p className='text-xs text-zinc-500 uppercase tracking-wide'>Created</p>
                    <p
                        className='text-sm text-zinc-300 font-medium'
                        title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                    >
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                    </p>
                </div>

                <div className='flex-shrink-0 flex items-center gap-2'>
                    {/* Cancel button for running backups */}
                    {backup.isInProgress && currentStatus.can_cancel && (
                        <Can action='backup.delete'>
                            <button
                                onClick={handleCancel}
                                className='p-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors'
                                title='Cancel backup'
                            >
                                <HugeIconsX className='w-4 h-4' />
                            </button>
                        </Can>
                    )}

                    {/* Retry button for failed backups */}
                    {currentStatus.status === 'failed' && currentStatus.can_retry && (
                        <Can action='backup.create'>
                            <button
                                onClick={handleRetry}
                                className='p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors'
                                title='Retry backup'
                            >
                                <HugeIconsRefresh className='w-4 h-4' />
                            </button>
                        </Can>
                    )}

                    {/* Context menu for completed backups */}
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!backup.isInProgress ? <BackupContextMenu backup={backup} /> : null}
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default BackupRow;
