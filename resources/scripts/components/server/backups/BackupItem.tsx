import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import HugeIconsSquareLock from '@/components/elements/hugeicons/SquareLock';
import HugeIconsStorage from '@/components/elements/hugeicons/Storage';
import HugeIconsRefresh from '@/components/elements/hugeicons/Refresh';
import { PageListItem } from '@/components/elements/pages/PageList';

import { bytesToString } from '@/lib/formatters';

import useFlash from '@/plugins/useFlash';
import { useUnifiedBackups } from './useUnifiedBackups';

import BackupContextMenu from './BackupContextMenu';

export interface UnifiedBackup {
    uuid: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    message: string;
    isSuccessful?: boolean;
    isLocked: boolean;
    checksum?: string;
    bytes?: number;
    createdAt: Date;
    completedAt?: Date | null;
    canRetry: boolean;
    canDelete: boolean;
    canDownload: boolean;
    canRestore: boolean;
    isLiveOnly: boolean;
    isDeletion?: boolean;
}

interface Props {
    backup: UnifiedBackup;
}

const BackupItem = ({ backup }: Props) => {
    const { addFlash, clearFlashes } = useFlash();
    const { retryBackup } = useUnifiedBackups();


    const handleRetry = async () => {
        if (!backup.canRetry) return;

        try {
            clearFlashes('backup');
            await retryBackup(backup.uuid);
            addFlash({
                type: 'success',
                title: 'Success',
                key: 'backup',
                message: 'Backup is being retried.',
            });
        } catch (error) {
            addFlash({
                type: 'error',
                title: 'Error',
                key: 'backup',
                message: error instanceof Error ? error.message : 'Failed to retry backup.',
            });
        }
    };

    const getStatusIcon = () => {
        const isActive = backup.status === 'running' || backup.status === 'pending';

        if (isActive) {
            return <Spinner size={'small'} />;
        } else if (backup.isLocked) {
            return <HugeIconsSquareLock className='text-red-400 w-4 h-4' fill='currentColor' />;
        } else if (backup.status === 'completed' || backup.isSuccessful) {
            return <HugeIconsStorage className='text-green-400 w-4 h-4' fill='currentColor' />;
        } else {
            return <HugeIconsStorage className='text-red-400 w-4 h-4' fill='currentColor' />;
        }
    };

    const getStatusBadge = () => {
        switch (backup.status) {
            case 'failed':
                return (
                    <span className='bg-red-500/20 border border-red-500/30 py-0.5 px-2 rounded text-red-300 text-xs font-medium'>
                        Failed
                    </span>
                );
            case 'pending':
                return (
                    <span className='bg-yellow-500/20 border border-yellow-500/30 py-0.5 px-2 rounded text-yellow-300 text-xs font-medium'>
                        Pending
                    </span>
                );
            case 'running':
                return (
                    <span className='bg-blue-500/20 border border-blue-500/30 py-0.5 px-2 rounded text-blue-300 text-xs font-medium'>
                        Running ({backup.progress}%)
                    </span>
                );
            case 'completed':
                // Don't show "Completed" badge for deletion operations
                if (backup.isDeletion) {
                    return null;
                }
                return backup.isLiveOnly ? (
                    <span className='bg-green-500/20 border border-green-500/30 py-0.5 px-2 rounded text-green-300 text-xs font-medium'>
                        Completed
                    </span>
                ) : null;
            case 'cancelled':
                return (
                    <span className='bg-gray-500/20 border border-gray-500/30 py-0.5 px-2 rounded text-gray-300 text-xs font-medium'>
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    const isActive = backup.status === 'running' || backup.status === 'pending';
    const showProgressBar = isActive || (backup.status === 'completed' && backup.isLiveOnly);

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

                    {/* Progress bar for active backups */}
                    {showProgressBar && (
                        <div className='mb-2'>
                            <div className='flex justify-between text-xs text-zinc-400 mb-1'>
                                <span>{backup.message || 'Processing...'}</span>
                                <span>{backup.progress}%</span>
                            </div>
                            <div className='w-full bg-zinc-700 rounded-full h-1.5'>
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        backup.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${backup.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error message for failed backups */}
                    {backup.status === 'failed' && backup.message && (
                        <p className='text-xs text-red-400 truncate mb-1'>{backup.message}</p>
                    )}

                    {backup.checksum && <p className='text-xs text-zinc-400 font-mono truncate'>{backup.checksum}</p>}

                </div>

                {/* Size info for completed backups */}
                <div className='hidden sm:block flex-shrink-0 text-right min-w-[80px]'>
                    {backup.completedAt && backup.isSuccessful && backup.bytes ? (
                        <>
                            <p className='text-xs text-zinc-500 uppercase tracking-wide'>Size</p>
                            <p className='text-sm text-zinc-300 font-medium'>{bytesToString(backup.bytes)}</p>
                        </>
                    ) : (
                        <>
                            <p className='text-xs text-transparent uppercase tracking-wide'>Size</p>
                            <p className='text-sm text-transparent font-medium'>-</p>
                        </>
                    )}
                </div>

                {/* Created time */}
                <div className='hidden sm:block flex-shrink-0 text-right min-w-[120px]'>
                    <p className='text-xs text-zinc-500 uppercase tracking-wide'>Created</p>
                    <p
                        className='text-sm text-zinc-300 font-medium'
                        title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                    >
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                    </p>
                </div>

                {/* Actions */}
                <div className='flex-shrink-0 flex items-center gap-2'>
                    {/* Retry button for failed backups */}
                    {backup.status === 'failed' && backup.canRetry && (
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

                    {/* Context menu for actionable backups */}
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!isActive && !backup.isLiveOnly && (
                            <BackupContextMenu
                                backup={{
                                    uuid: backup.uuid,
                                    name: backup.name,
                                    isSuccessful: backup.isSuccessful || false,
                                    isLocked: backup.isLocked,
                                    checksum: backup.checksum || '',
                                    bytes: backup.bytes || 0,
                                    createdAt: backup.createdAt,
                                    completedAt: backup.completedAt,
                                    canRetry: backup.canRetry,
                                    jobStatus: backup.status,
                                    jobProgress: backup.progress,
                                    jobMessage: backup.message,
                                    jobId: '',
                                    jobError: null,
                                    object: 'backup' as const
                                }}
                            />
                        )}
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default BackupItem;