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

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, async (data) => {
        try {
            const parsed = JSON.parse(data);

            await mutate(
                (data) => ({
                    ...data!,
                    items: data!.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              },
                    ),
                }),
                false,
            );
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <PageListItem>
                    <div className={`flex-auto max-w-full box-border`}>
                        <div className='flex flex-row align-middle items-center gap-6 truncate'>
                            <div className='flex-none'>
                                {backup.completedAt === null ? (
                                    <Spinner size={'small'} />
                                ) : backup.isLocked ? (
                                    <FontAwesomeIcon icon={faLock} className='text-red-500' />
                                ) : (
                                    <FontAwesomeIcon icon={faFile} />
                                )}
                            </div>
                            <div className={`flex items-center w-full md:flex-1`}>
                                <div className={`flex flex-col`}>
                                    <div className={`flex items-center text-sm mb-1`}>
                                        {backup.completedAt !== null && !backup.isSuccessful && (
                                            <span
                                                className={`bg-red-500 py-px px-2 rounded-full text-white text-xs uppercase border border-red-600 mr-2`}
                                            >
                                                Failed
                                            </span>
                                        )}
                                        <div className={`flex gap-2 items-center justify-center`}>
                                            <p className='break-words truncate text-lg'>{backup.name}</p>
                                        </div>
                                    </div>
                                    {backup.checksum && (
                                        <p className={`mt-1 md:mt-0 text-xs text-zinc-400 font-mono truncate`}>
                                            {backup.checksum}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-row justify-center font-medium sm:justify-between min-w-full lg:w-96 sm:min-w-40'>
                        {backup.completedAt !== null && backup.isSuccessful && (
                            <>
                                <span className={`text-xs sm:flex-initial sm:ml-0`}>{bytesToString(backup.bytes)}</span>
                                <p className={`text-xs inline sm:hidden`}>,&nbsp;</p>
                            </>
                        )}
                        <p
                            title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                            className={`text-xs sm:flex-initial`}
                        >
                            {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                        </p>
                    </div>

                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!backup.completedAt ? <></> : <BackupContextMenu backup={backup} />}
                    </Can>
                </PageListItem>
            </ContextMenuTrigger>
        </ContextMenu>
    );
};

export default BackupRow;
