import React, { memo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faEllipsisH,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import styled from 'styled-components/macro';
import useEventListener from '@/plugins/useEventListener';
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

type ModalType = 'rename' | 'move' | 'chmod';

const StyledRow = styled.div<{ $danger?: boolean }>`
    ${tw`px-3 py-2 text-sm font-bold flex gap-4 items-center rounded-md w-full text-white`};
    transition: 80ms all ease;

    &:hover {
        transition: 0ms all ease;
        ${tw`bg-[#ffffff13] shadow-md`}
    }
`;

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: IconDefinition;
    title: string;
    $danger?: boolean;
}

const Row = ({ icon, title, ...props }: RowProps) => (
    <StyledRow {...props}>
        <FontAwesomeIcon icon={icon} css={tw`text-xs`} fixedWidth />
        <span>{title}</span>
    </StyledRow>
);

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail);
        }
    });

    const doDeletion = () => {
        clearFlashes('files');

        // For UI speed, immediately remove the file from the listing before calling the deletion function.
        // If the delete actually fails, we'll fetch the current directory contents again automatically.
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
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
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) => (
                    <div css={tw`px-4 py-2 hover:text-white`} onClick={onClick}>
                        <FontAwesomeIcon icon={faEllipsisH} />
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
                        <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    </div>
                )}
            >
                <Can action={'file.update'}>
                    <StyledRow onClick={() => setModal('rename')}>
                        <HugeIconsPencil className='!h-4 !w-4' fill='currentColor' />
                        <span>Rename</span>
                    </StyledRow>
                    <StyledRow onClick={() => setModal('move')}>
                        <HugeIconsMoveTo className='!h-4 !w-4' fill='currentColor' />
                        <span>Move</span>
                    </StyledRow>
                    <StyledRow onClick={() => setModal('chmod')}>
                        <HugeIconsFileSecurity className='!h-4 !w-4' fill='currentColor' />
                        <span>Permissions</span>
                    </StyledRow>
                    {/* <Row onClick={() => setModal('rename')} icon={faPencilAlt} title={'Rename'} />
                    <Row onClick={() => setModal('move')} icon={faLevelUpAlt} title={'Move'} />
                    <Row onClick={() => setModal('chmod')} icon={faFileCode} title={'Permissions'} /> */}
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <StyledRow onClick={doCopy}>
                            <HugeIconsCopy className='!h-4 !w-4' fill='currentColor' />
                            <span>Copy</span>
                        </StyledRow>
                        {/* <Row onClick={doCopy} icon={faCopy} title={'Copy'} /> */}
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <Row onClick={doUnarchive} icon={faBoxOpen} title={'Unarchive'} />
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <StyledRow onClick={doArchive}>
                            <HugeIconsFileZip className='!h-4 !w-4' fill='currentColor' />
                            <span>Archive</span>
                        </StyledRow>
                        {/* <Row onClick={doArchive} icon={faFileArchive} title={'Archive'} /> */}
                    </Can>
                )}
                {file.isFile && (
                    <StyledRow onClick={doDownload}>
                        <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                        <span>Download</span>
                    </StyledRow>
                    // <Row onClick={doDownload} icon={faFileDownload} title={'Download'} />
                )}
                <Can action={'file.delete'}>
                    <StyledRow onClick={() => setShowConfirmation(true)}>
                        <HugeIconsDelete className='!h-4 !w-4' fill='currentColor' />
                        <span>Delete</span>
                    </StyledRow>
                    {/* <Row onClick={() => setShowConfirmation(true)} icon={faTrashAlt} title={'Delete'} $danger /> */}
                </Can>
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
