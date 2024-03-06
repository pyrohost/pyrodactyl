import axios from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import tw from 'twin.macro';
import { useEffect, useRef, useState } from 'react';
import { ModalMask } from '@/components/elements/Modal';
import useEventListener from '@/plugins/useEventListener';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import Portal from '@/components/elements/Portal';
// FIXME: add icons back
import FadeTransition from '@/components/elements/transitions/FadeTransition';

function isFileOrDirectory(event: DragEvent): boolean {
    if (!event.dataTransfer?.types) {
        return false;
    }

    return event.dataTransfer.types.some((value) => value.toLowerCase() === 'files');
}

export default () => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const [timeouts, setTimeouts] = useState<NodeJS.Timeout[]>([]);
    const [visible, setVisible] = useState(false);
    const { mutate } = useFileManagerSwr();
    const { addError, clearAndAddHttpError } = useFlashKey('files');

    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, appendFileUpload, removeFileUpload } = ServerContext.useStoreActions(
        (actions) => actions.files
    );

    useEventListener(
        'dragenter',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFileOrDirectory(e)) {
                return setVisible(true);
            }
        },
        { capture: true }
    );

    useEventListener('dragexit', () => setVisible(false), { capture: true });

    useEventListener('keydown', () => {
        visible && setVisible(false);
    });

    useEffect(() => {
        return () => timeouts.forEach(clearTimeout);
    }, []);

    const onUploadProgress = (data: ProgressEvent, name: string) => {
        appendFileUpload({ name, loaded: data.loaded, total: data.total });
        if (data.loaded >= data.total) {
            const timeout = setTimeout(() => removeFileUpload(name), 500);
            setTimeouts((t) => [...t, timeout]);
        }
    };

    const onFileSubmission = (files: FileList) => {
        clearAndAddHttpError();
        const list = Array.from(files);
        if (list.some((file) => !file.size || (!file.type && file.size === 4096))) {
            return addError('Folder uploads are not supported at this time.', 'Error');
        }

        if (!list.length) {
            return;
        }

        const uploads = list.map((file) => {
            appendFileUpload({ name: file.name, loaded: 0, total: file.size });
            return () =>
                getFileUploadUrl(uuid).then((url) =>
                    axios.post(
                        url,
                        { files: file },
                        {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            params: { directory },
                            onUploadProgress: (data) => {
                                onUploadProgress(data, file.name);
                            },
                        }
                    )
                );
        });

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearFileUploads();
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <Portal>
                <FadeTransition show={visible} duration='duration-75' key='upload_modal_mask' appear unmount>
                    <ModalMask
                        onClick={() => setVisible(false)}
                        onDragOver={(e) => e.preventDefault()}
                        // why doesn't vanilla pterodactyl have this?
                        onDragLeave={() => {
                            setVisible(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            setVisible(false);
                            if (!e.dataTransfer?.files.length) return;

                            onFileSubmission(e.dataTransfer.files);
                        }}
                    >
                        <div className={'w-full flex items-center justify-center pointer-events-none'}>
                            <div
                                className={
                                    'relative flex flex-col items-center gap-4 bg-brand w-full rounded-2xl py-12 px-4 mx-10 max-w-sm'
                                }
                            >
                                <div className='absolute inset-4 border-dashed border-[#ffffff88] border-2 rounded-xl'></div>
                                <svg
                                    width='24'
                                    height='24'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='w-8 h-8'
                                >
                                    <path
                                        d='M16.2812 1.25C17.5268 1.24996 18.5627 1.24993 19.3845 1.36163C20.2516 1.47949 21.0278 1.73812 21.6498 2.36687C22.2702 2.9941 22.524 3.77443 22.6399 4.64582C22.7501 5.47443 22.75 6.51982 22.75 7.78076V10.7193C22.75 11.9802 22.7501 13.0256 22.6399 13.8542C22.524 14.7256 22.2702 15.5059 21.6498 16.1331C21.0278 16.7619 20.2516 17.0205 19.3845 17.1384C18.5627 17.2501 17.5268 17.25 16.2812 17.25L15.2876 17.25C14.7353 17.25 14.2876 16.8023 14.2876 16.25C14.2876 15.6977 14.7353 15.25 15.2876 15.25H16.2108C17.545 15.25 18.4439 15.2478 19.1151 15.1566C19.7564 15.0694 20.0386 14.918 20.2278 14.7267C20.4186 14.5338 20.5704 14.2441 20.6573 13.5905C20.7479 12.9093 20.75 11.9979 20.75 10.65V7.85C20.75 6.5021 20.7479 5.59069 20.6573 4.90947C20.5704 4.2559 20.4186 3.96621 20.2278 3.77334C20.0386 3.58198 19.7564 3.43057 19.1151 3.34341C18.4439 3.25217 17.545 3.25 16.2108 3.25H15.2876C13.9534 3.25 13.0545 3.25217 12.3833 3.34341C12.2051 3.36763 12.1496 3.58343 12.285 3.70185L14.9085 5.99743C15.263 6.30758 15.3458 6.81271 15.1369 7.21248C15.0964 7.2899 15.0762 7.32861 15.0131 7.3711C14.9501 7.41358 14.8886 7.41953 14.7656 7.43142L9.74449 7.91666C9.19222 7.91361 8.74697 7.46344 8.75002 6.91116C8.75496 6.01395 8.77445 5.23439 8.86797 4.57713C8.96274 3.91111 9.14328 3.29001 9.52575 2.75108C9.62278 2.61437 9.73032 2.48648 9.84864 2.36687C10.4706 1.73812 11.2468 1.47949 12.1139 1.36163C12.9357 1.24993 13.9716 1.24996 15.2172 1.25H16.2812Z'
                                        fill='white'
                                    />
                                    <path
                                        fill-rule='evenodd'
                                        clip-rule='evenodd'
                                        d='M9.59334 5.25H9.59333H9.59332H8.40669H8.40667H8.40666C6.93025 5.24998 5.74683 5.24997 4.81751 5.37372C3.85586 5.50178 3.05447 5.77447 2.41849 6.4044C1.78151 7.03531 1.50485 7.83196 1.3751 8.78785C1.24997 9.70973 1.24998 10.8831 1.25 12.3443V12.3443V12.3443V15.6557V15.6557V15.6557C1.24998 17.1169 1.24997 18.2903 1.3751 19.2122C1.50485 20.168 1.78151 20.9647 2.41849 21.5956C3.05447 22.2255 3.85586 22.4982 4.81751 22.6263C5.74682 22.75 6.93025 22.75 8.40666 22.75H9.59335C11.0698 22.75 12.2532 22.75 13.1825 22.6263C14.1441 22.4982 14.9455 22.2255 15.5815 21.5956C16.2185 20.9647 16.4952 20.168 16.6249 19.2122C16.75 18.2903 16.75 17.1169 16.75 15.6557V12.3443C16.75 10.8831 16.75 9.70973 16.6249 8.78785C16.4952 7.83196 16.2185 7.03531 15.5815 6.4044C14.9455 5.77447 14.1441 5.50178 13.1825 5.37372C12.2532 5.24997 11.0698 5.24998 9.59334 5.25ZM6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13H9C9.55229 13 10 12.5523 10 12C10 11.4477 9.55229 11 9 11H6ZM6 16C5.44772 16 5 16.4477 5 17C5 17.5523 5.44772 18 6 18H11C11.5523 18 12 17.5523 12 17C12 16.4477 11.5523 16 11 16H6Z'
                                        fill='white'
                                    />
                                </svg>
                                <h1
                                    className={
                                        'flex-1 text-lg font-bold tracking-tight text-center truncate w-full relative px-4'
                                    }
                                >
                                    Upload to {name}
                                </h1>
                            </div>
                        </div>
                    </ModalMask>
                </FadeTransition>
            </Portal>
            <input
                type={'file'}
                ref={fileUploadInput}
                css={tw`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;

                    onFileSubmission(e.currentTarget.files);
                    if (fileUploadInput.current) {
                        fileUploadInput.current.files = null;
                    }
                }}
                multiple
            />
            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-r-full rounded-l-md text-sm font-bold shadow-md'
                onClick={() => fileUploadInput.current && fileUploadInput.current.click()}
            >
                Upload
            </button>
        </>
    );
};
