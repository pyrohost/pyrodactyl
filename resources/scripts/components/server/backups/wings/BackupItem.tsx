import { Cloud, CloudArrowUpIn, Lock, File } from '@gravity-ui/icons';

import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import { ContextMenu, ContextMenuTrigger } from '@/components/elements/ContextMenu';
import Spinner from '@/components/elements/Spinner';
import { PageListItem } from '@/components/elements/pages/PageList';
import { SocketEvent } from '@/components/server/events';

import { bytesToString } from '@/lib/formatters';

import { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';

// import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

import BackupContextMenu from './BackupContextMenu';

interface Props {
    backup: ServerBackup;
}

const BackupItem = ({ backup }: Props) => {
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

    const getStatusIcon = () => {
        const isActive = backup.isInProgress === true || backup.isInProgress === false;
        if (backup.completedAt === null) {
            return <Spinner size={'small'} />;
        }
        if (isActive) {
            return <Spinner size={'small'} />;
        } else if (backup.isLocked) {
            return <Lock width={22} height={22} className='text-red-400 ' fill='currentColor' />;
        } else if (backup.isInProgress === true || backup.isSuccessful) {
            return <Cloud width={22} height={22} className='text-green-400 ' fill='currentColor' />;
        } else {
            return <Cloud width={22} height={22} className='text-red-400 ' fill='currentColor' />;
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <PageListItem>
                    <div className='flex items-center gap-3 w-full'>
                        <div className='flex flex-row align-middle items-center gap-6 truncate'>
                            <div className='flex-shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                {getStatusIcon()}
                            </div>
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-1.5'>
                                    <h3 className='text-sm font-medium text-zinc-100 truncate'>{backup.name}</h3>
                                    {backup.isAutomatic && (
                                        <span className='text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded'>
                                            Automatic
                                        </span>
                                    )}
                                    {backup.isLocked && (
                                        <span className='text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded'>
                                            Locked
                                        </span>
                                    )}
                                </div>
                                {backup.checksum && <p className='text-xs text-zinc-400 font-mono truncate'>{backup.checksum}</p>}
                            </div>
                        </div>
                    </div>

                    <div className='visible sm:block flex-shrink-0 text-right min-w-[90px] '>
                        {backup.completedAt && backup.bytes ? (
                            <>
                                <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Size</p>
                                <p className='text-sm text-zinc-300 font-medium'>{bytesToString(backup.bytes)}</p>
                            </>
                        ) : (
                            <>
                                <p className='text-xs text-transparent uppercase tracking-wide mb-1'>Size</p>
                                <p className='text-sm text-transparent font-medium'>-</p>
                            </>
                        )}
                    </div>

                    <div className='hidden sm:block flex-shrink-0 text-right min-w-[130px] mr-5'>
                        <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Created</p>
                        <p
                            className='text-sm text-zinc-300 font-medium'
                            title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
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

export default BackupItem;
