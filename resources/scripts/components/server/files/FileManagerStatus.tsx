import { Xmark } from '@gravity-ui/icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useContext, useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';

import asDialog from '@/hoc/asDialog';

import { ServerContext } from '@/state/server';

// TODO: Make it more pretty
const CircleProgress = ({ progress, className }: { progress: number; className?: string }) => {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg className={className} viewBox='0 0 32 32'>
            <circle
                stroke='currentColor'
                strokeWidth='4'
                fill='transparent'
                r={radius}
                cx='16'
                cy='16'
                className='opacity-25'
            />
            <circle
                className='transition-all duration-300'
                stroke='currentColor'
                strokeWidth='4'
                strokeLinecap='round'
                fill='transparent'
                r={radius}
                cx='16'
                cy='16'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform='rotate(-90 16 16)'
            />
        </svg>
    );
};

const FileUploadList = () => {
    const { close } = useContext(DialogWrapperContext);
    const cancelFileUpload = ServerContext.useStoreActions((actions) => actions.files.cancelFileUpload);
    const clearFileUploads = ServerContext.useStoreActions((actions) => actions.files.clearFileUploads);
    const uploads = ServerContext.useStoreState((state) =>
        Object.entries(state.files.uploads).sort(([a], [b]) => a.localeCompare(b)),
    );

    return (
        <Tooltip.Provider>
            <div className={'space-y-2 mt-6'}>
                {uploads.map(([name, file]) => (
                    <div key={name} className={'flex items-center space-x-3 bg-zinc-700 p-3 rounded-sm'}>
                        <Tooltip.Root delayDuration={200}>
                            <Tooltip.Trigger asChild>
                                <div className={'shrink-0'}>
                                    <CircleProgress progress={(file.loaded / file.total) * 100} className={'w-6 h-6'} />
                                </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Content
                                    side='left'
                                    className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg z-9999'
                                    sideOffset={5}
                                >
                                    {`${Math.floor((file.loaded / file.total) * 100)}%`}
                                    <Tooltip.Arrow className='fill-gray-800' />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                        <Code className={'flex-1 truncate'}>{name}</Code>
                        <Tooltip.Root delayDuration={200}>
                            <Tooltip.Trigger asChild>
                                <ActionButton
                                    variant='secondary'
                                    size='sm'
                                    onClick={cancelFileUpload.bind(this, name)}
                                    className='hover:!text-red-400'
                                >
                                    <Xmark />
                                </ActionButton>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Content
                                    side='right'
                                    className='px-2 py-1 text-sm bg-gray-800 text-red-400 rounded shadow-lg z-9999'
                                    sideOffset={5}
                                >
                                    Cancel
                                    <Tooltip.Arrow className='fill-gray-800' />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
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
        </Tooltip.Provider>
    );
};

const FileUploadListDialog = asDialog({
    title: 'File Uploads',
    description: 'The following files are being uploaded to your server.',
})(FileUploadList);

const FileManagerStatus = () => {
    const [open, setOpen] = useState(false);

    const count = ServerContext.useStoreState((state) => Object.keys(state.files.uploads).length);

    useEffect(() => {
        if (count === 0) {
            setOpen(false);
        }
    }, [count]);

    return (
        <>
            <Tooltip.Provider>
                {count > 0 && (
                    <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                            <ActionButton
                                variant='secondary'
                                size='sm'
                                className='w-10 h-10 p-0'
                                onClick={() => {
                                    setOpen(true);
                                }}
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
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content
                                side='top'
                                className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg'
                                sideOffset={5}
                            >
                                {`${count} files are uploading, click to view`}
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>
                )}
                <FileUploadListDialog open={open} onClose={() => setOpen(false)} />
            </Tooltip.Provider>
        </>
    );
};

export default FileManagerStatus;
