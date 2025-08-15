import { faFile, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import { ContextMenu, ContextMenuTrigger } from '@/components/elements/ContextMenu';
import Spinner from '@/components/elements/Spinner';
import { PageListItem } from '@/components/elements/pages/PageList';
import { SocketEvent } from '@/components/server/events';

import { bytesToString } from '@/lib/formatters';

import { ServerBackup } from '@/api/server/types';
// import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import getServerBackups from '@/api/swr/getServerBackups';

// import Can from '@/components/elements/Can';
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
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-3 mb-2'>
                        <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                            {backup.completedAt === null ? (
                                <Spinner size={'small'} />
                            ) : backup.isLocked ? (
                                <FontAwesomeIcon icon={faLock} className='text-red-400 w-4 h-4' />
                            ) : backup.isSuccessful ? (
                                <FontAwesomeIcon icon={faFile} className='text-green-400 w-4 h-4' />
                            ) : (
                                <FontAwesomeIcon icon={faFile} className='text-red-400 w-4 h-4' />
                            )}
                        </div>
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                                {backup.completedAt !== null && !backup.isSuccessful && (
                                    <span className='bg-red-500 py-1 px-2 rounded-full text-white text-xs uppercase font-medium'>
                                        Failed
                                    </span>
                                )}
                                <h3 className='text-base font-medium text-zinc-100 truncate'>{backup.name}</h3>
                                {backup.isLocked && (
                                    <span className='text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded'>
                                        Locked
                                    </span>
                                )}
                            </div>
                            {backup.checksum && (
                                <p className='text-sm text-zinc-400 font-mono truncate'>{backup.checksum}</p>
                            )}
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                        {backup.completedAt !== null && backup.isSuccessful && (
                            <div>
                                <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Size</p>
                                <p className='text-zinc-300 font-medium'>{bytesToString(backup.bytes)}</p>
                            </div>
                        )}
                        <div>
                            <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Created</p>
                            <p
                                className='text-zinc-300 font-medium'
                                title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                            >
                                {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2 sm:flex-col sm:gap-3'>
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {backup.completedAt ? <BackupContextMenu backup={backup} /> : null}
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default BackupRow;
