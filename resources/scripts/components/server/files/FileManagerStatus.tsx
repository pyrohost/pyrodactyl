// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
// FIXME: add icons back
import { useSignal } from '@preact/signals-react';
import { useContext, useEffect } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';

import asDialog from '@/hoc/asDialog';

import { ServerContext } from '@/state/server';

const svgProps = {
    cx: 16,
    cy: 16,
    r: 14,
    strokeWidth: 3,
    fill: 'none',
    stroke: 'currentColor',
};

const Spinner = ({ progress, className }: { progress: number; className?: string }) => (
    <svg viewBox={'0 0 32 32'} className={className}>
        <circle {...svgProps} className={'opacity-25'} />
        <circle
            {...svgProps}
            stroke={'white'}
            strokeDasharray={28 * Math.PI}
            className={'rotate-[-90deg] origin-[50%_50%] transition-[stroke-dashoffset] duration-300'}
            style={{ strokeDashoffset: ((100 - progress) / 100) * 28 * Math.PI }}
        />
    </svg>
);

const FileUploadList = () => {
    const { close } = useContext(DialogWrapperContext);
    const cancelFileUpload = ServerContext.useStoreActions((actions) => actions.files.cancelFileUpload);
    const clearFileUploads = ServerContext.useStoreActions((actions) => actions.files.clearFileUploads);
    const uploads = ServerContext.useStoreState((state) =>
        Object.entries(state.files.uploads).sort(([a], [b]) => a.localeCompare(b)),
    );

    return (
        <div className={'space-y-2 mt-6'}>
            {uploads.map(([name, file]) => (
                <div key={name} className={'flex items-center space-x-3 bg-zinc-700 p-3 rounded-sm'}>
                    {/* <Tooltip content={`${Math.floor((file.loaded / file.total) * 100)}%`} placement={'left'}> */}
                    <div className={'shrink-0'}>
                        <Spinner progress={(file.loaded / file.total) * 100} className={'w-6 h-6'} />
                    </div>
                    {/* </Tooltip> */}
                    <Code className={'flex-1 truncate'}>{name}</Code>
                    <ActionButton
                        variant='secondary'
                        size='sm'
                        onClick={cancelFileUpload.bind(this, name)}
                        className='hover:!text-red-400'
                    >
                        Cancel
                    </ActionButton>
                </div>
            ))}
            <Dialog.Footer>
                <ActionButton variant='danger' onClick={() => clearFileUploads()}>
                    Cancel Uploads
                </ActionButton>
                <ActionButton variant='secondary' onClick={close}>
                    Close
                </ActionButton>
            </Dialog.Footer>
        </div>
    );
};

const FileUploadListDialog = asDialog({
    title: 'File Uploads',
    description: 'The following files are being uploaded to your server.',
})(FileUploadList);

const FileManagerStatus = () => {
    const open = useSignal(false);

    const count = ServerContext.useStoreState((state) => Object.keys(state.files.uploads).length);

    useEffect(() => {
        if (count === 0) {
            open.value = false;
        }
    }, [count]);

    return (
        <>
            {count > 0 && (
                // <Tooltip content={`${count} files are uploading, click to view`}>
                <ActionButton
                    variant='secondary'
                    size='sm'
                    className='w-10 h-10 p-0'
                    onClick={() => (open.value = true)}
                >
                    <svg
                        className='animate-spin h-5 w-5 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                    >
                        <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                        ></circle>
                        <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                    </svg>
                </ActionButton>
                // </Tooltip>
            )}
            <FileUploadListDialog open={open.value} onClose={() => (open.value = false)} />
        </>
    );
};

export default FileManagerStatus;
