import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { PageListItem } from '@/components/elements/pages/PageList';
import { SocketEvent } from '@/components/server/events';
import HugeIconsStorage from '@/components/elements/hugeicons/Storage';
import HugeIconsSquareLock from '@/components/elements/hugeicons/SquareLock';

import { bytesToString } from '@/lib/formatters';

import { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

import BackupContextMenu from './BackupContextMenu';

interface Props {
    backup: ServerBackup;
}

const BackupRow = ({ backup }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, async () => {
        try {
            // When backup completes, refresh the backup list from API to get accurate completion time
            // This ensures we get the exact completion timestamp from the database, not the websocket receive time
            await mutate();
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <PageListItem>
            <div className='flex items-center gap-4 w-full py-1'>
                {/* Status Icon */}
                <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                    {backup.completedAt === null ? (
                        <Spinner size={'small'} />
                    ) : backup.isLocked ? (
                        <HugeIconsSquareLock className='text-red-400 w-4 h-4' fill='currentColor' />
                    ) : backup.isSuccessful ? (
                        <HugeIconsStorage className='text-green-400 w-4 h-4' fill='currentColor' />
                    ) : (
                        <HugeIconsStorage className='text-red-400 w-4 h-4' fill='currentColor' />
                    )}
                </div>

                {/* Main Content */}
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                        {backup.completedAt !== null && !backup.isSuccessful && (
                            <span className='bg-red-500/20 border border-red-500/30 py-0.5 px-2 rounded text-red-300 text-xs font-medium'>
                                Failed
                            </span>
                        )}
                        <h3 className='text-sm font-medium text-zinc-100 truncate'>{backup.name}</h3>
                        <span
                            className={`text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded transition-opacity ${
                                backup.isLocked ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            Locked
                        </span>
                    </div>
                    {backup.checksum && (
                        <p className='text-xs text-zinc-400 font-mono truncate'>{backup.checksum}</p>
                    )}
                </div>

                {/* Size Info */}
                {backup.completedAt !== null && backup.isSuccessful && (
                    <div className='hidden sm:block flex-shrink-0 text-right'>
                        <p className='text-xs text-zinc-500 uppercase tracking-wide'>Size</p>
                        <p className='text-sm text-zinc-300 font-medium'>{bytesToString(backup.bytes)}</p>
                    </div>
                )}

                {/* Date Info */}
                <div className='hidden sm:block flex-shrink-0 text-right min-w-[120px]'>
                    <p className='text-xs text-zinc-500 uppercase tracking-wide'>Created</p>
                    <p
                        className='text-sm text-zinc-300 font-medium'
                        title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                    >
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                    </p>
                </div>

                {/* Actions Menu */}
                <div className='flex-shrink-0'>
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {backup.completedAt ? <BackupContextMenu backup={backup} /> : null}
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default BackupRow;
