import { join } from 'pathe';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';
import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';
import HugeIconsFileZip from '@/components/elements/hugeicons/FileZip';
import HugeIconsMoveTo from '@/components/elements/hugeicons/MoveTo';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import RenameFileModal from '@/components/server/files/RenameFileModal';

import compressFiles from '@/api/server/files/compressFiles';
import copyFile from '@/api/server/files/copyFile';
import decompressFiles from '@/api/server/files/decompressFiles';
import deleteFiles from '@/api/server/files/deleteFiles';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import { FileObject } from '@/api/server/files/loadDirectory';

import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';

type ModalType = 'rename' | 'move' | 'chmod';

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const doDeletion = async () => {
        clearFlashes('files');

        await mutate((files) => files!.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });

        setShowConfirmation(false);
    };

    const doCopy = () => {
        clearFlashes('files');
        toast.info('Duplicating...');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .then(() => toast.success('File successfully duplicated.'))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doDownload = () => {
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doArchive = () => {
        clearFlashes('files');
        toast.info('Archiving files...');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .then(() => toast.success('Files successfully archived.'))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doUnarchive = () => {
        clearFlashes('files');
        toast.info('Unarchiving files...');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .then(() => toast.success('Files successfully unarchived.'))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                confirm={'Delete'}
                onConfirmed={doDeletion}
            >
                You will not be able to recover the contents of
                <span className={'font-semibold text-zinc-50'}> {file.name}</span> once deleted.
            </Dialog.Confirm>
            {modal ? (
                modal === 'chmod' ? (
                    <ChmodFileModal
                        visible
                        appear
                        files={[{ file: file.name, mode: file.modeBits }]}
                        onDismissed={() => setModal(null)}
                    />
                ) : (
                    <RenameFileModal
                        visible
                        appear
                        files={[file.name]}
                        useMoveTerminology={modal === 'move'}
                        onDismissed={() => setModal(null)}
                    />
                )
            ) : null}
            <ContextMenuContent className='flex flex-col gap-1'>
                <Can action={'file.update'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('rename')}>
                        <HugeIconsPencil className='h-4! w-4!' fill='currentColor' />
                        <span>Rename</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('move')}>
                        <HugeIconsMoveTo className='h-4! w-4!' fill='currentColor' />
                        <span>Move</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('chmod')}>
                        <HugeIconsFileSecurity className='h-4! w-4!' fill='currentColor' />
                        <span>Permissions</span>
                    </ContextMenuItem>
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onClick={doCopy}>
                            <HugeIconsCopy className='h-4! w-4!' fill='currentColor' />
                            <span>Duplicate</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doUnarchive} title={'Unarchive'}>
                            <HugeIconsFileZip className='h-4! w-4!' fill='currentColor' />
                            <span>Unarchive</span>
                        </ContextMenuItem>
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doArchive}>
                            <HugeIconsFileZip className='h-4! w-4!' fill='currentColor' />
                            <span>Archive</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isFile && (
                    <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                        <HugeIconsFileDownload className='h-4! w-4!' fill='currentColor' />
                        <span>Download</span>
                    </ContextMenuItem>
                )}
                <Can action={'file.delete'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowConfirmation(true)}>
                        <HugeIconsDelete className='h-4! w-4!' fill='currentColor' />
                        <span>Delete</span>
                    </ContextMenuItem>
                </Can>
            </ContextMenuContent>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
