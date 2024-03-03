import { format, formatDistanceToNow } from 'date-fns';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { SocketEvent } from '@/components/server/events';

interface Props {
    backup: ServerBackup;
    className?: string;
}

export default ({ backup, className }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, (data) => {
        try {
            const parsed = JSON.parse(data);

            mutate(
                (data) => ({
                    ...data,
                    items: data.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              }
                    ),
                }),
                false
            );
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <GreyRowBox css={tw`flex-wrap md:flex-nowrap items-center`} className={className}>
            <div className={`flex items-center truncate w-full md:flex-1`}>
                {/* <div css={tw`mr-4`}>
                    {backup.completedAt !== null ? (
                        backup.isLocked ? (
                            <FontAwesomeIcon icon={faLock} css={tw`text-yellow-500`} />
                        ) : (
                            <FontAwesomeIcon icon={faArchive} css={tw`text-zinc-300`} />
                        )
                    ) : (
                        <Spinner size={'small'} />
                    )}
                </div> */}
                <div css={tw`flex flex-col truncate`}>
                    <div css={tw`flex items-center text-sm mb-1`}>
                        {backup.completedAt !== null && !backup.isSuccessful && (
                            <span
                                css={tw`bg-red-500 py-px px-2 rounded-full text-white text-xs uppercase border border-red-600 mr-2`}
                            >
                                Failed
                            </span>
                        )}
                        <div className={`flex gap-2 items-center justify-center`}>
                            <p className='break-words truncate text-lg'>{backup.name}</p>
                            {backup.completedAt !== null ? (
                                backup.isLocked ? (
                                    <span className='font-bold z-10 rounded-full bg-brand px-2 py-1 text-xs text-white'>
                                        Locked
                                    </span>
                                ) : null
                            ) : (
                                <Spinner size={'small'} />
                            )}
                        </div>
                    </div>
                    <p className={`mt-1 md:mt-0 text-xs text-zinc-400 font-mono truncate`}>{backup.checksum}</p>
                </div>
            </div>
            <div className={`flex flex-1 md:flex-none md:w-48 mt-4 md:mt-0 md:ml-8 md:text-center`}>
                {backup.completedAt !== null && backup.isSuccessful && (
                    <span css={tw`text-xs hidden sm:inline`}>{bytesToString(backup.bytes)}</span>
                )}
            </div>
            <div className={`flex flex-1 md:flex-none md:w-48 mt-4 md:mt-0 md:ml-8 md:text-center`}>
                <p title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')} className={`text-xs`}>
                    {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true })}
                </p>
            </div>
            <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                {!backup.completedAt ? <div className='w-8'></div> : <BackupContextMenu backup={backup} />}
            </Can>
        </GreyRowBox>
    );
};
