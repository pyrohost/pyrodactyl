import { memo, useState } from 'react';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import HugeIconsMoveTo from '@/components/elements/hugeicons/MoveTo';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';
import HugeIconsFileZip from '@/components/elements/hugeicons/FileZip';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';

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

        // For UI speed, immediately remove the file from the listing before calling the deletion function.
        // If the delete actually fails, we'll fetch the current directory contents again automatically.
        await mutate((files) => files!.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
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

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doUnarchive = () => {
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
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
                You will not be able to recover the contents of&nbsp;
                <span className={'font-semibold text-zinc-50'}>{file.name}</span> once deleted.
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
                        <HugeIconsPencil className='!h-4 !w-4' fill='currentColor' />
                        <span>Rename</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('move')}>
                        <HugeIconsMoveTo className='!h-4 !w-4' fill='currentColor' />
                        <span>Move</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('chmod')}>
                        <HugeIconsFileSecurity className='!h-4 !w-4' fill='currentColor' />
                        <span>Permissions</span>
                    </ContextMenuItem>
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onClick={doCopy}>
                            <HugeIconsCopy className='!h-4 !w-4' fill='currentColor' />
                            <span>Copy</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doUnarchive} title={'Unarchive'} />
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doArchive}>
                            <HugeIconsFileZip className='!h-4 !w-4' fill='currentColor' />
                            <span>Archive</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isFile && (
                    <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                        <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                        <span>Download</span>
                    </ContextMenuItem>
                )}
                <Can action={'file.delete'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowConfirmation(true)}>
                        <HugeIconsDelete className='!h-4 !w-4' fill='currentColor' />
                        <span>Delete</span>
                    </ContextMenuItem>
                </Can>
            </ContextMenuContent>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
