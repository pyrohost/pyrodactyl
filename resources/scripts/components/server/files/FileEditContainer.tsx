import { encodePathSegments } from '@/helpers';
import type { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { For } from 'million/react';
import { dirname } from 'pathe';
import { lazy } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileNameModal from '@/components/server/files/FileNameModal';

import { httpErrorToHuman } from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const Editor = lazy(() => import('@/components/elements/editor/Editor'));

export default () => {
    const [error, setError] = useState('');
    const { action, '*': rawFilename } = useParams<{ action: 'edit' | 'new'; '*': string }>();
    const [_, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [language, setLanguage] = useState<LanguageDescription>();

    const [filename, setFilename] = useState<string>('');

    useEffect(() => {
        setFilename(decodeURIComponent(rawFilename ?? ''));
    }, [rawFilename]);

    const navigate = useNavigate();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (action === 'new') {
            return;
        }

        if (filename === '') {
            return;
        }

        setError('');
        setLoading(true);
        setDirectory(dirname(filename));
        getFileContents(uuid, filename)
            .then(setContent)
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, filename]);

    const save = (name?: string) => {
        return new Promise<void>((resolve, reject) => {
            setLoading(true);
            toast.success(`Saving ${name ?? filename}...`);
            clearFlashes('files:view');
            if (fetchFileContent) {
                fetchFileContent()
                    .then((content) => saveFileContents(uuid, name ?? filename, content))
                    .then(() => {
                        toast.success(`Saved ${name ?? filename}!`);
                        if (name) {
                            navigate(`/server/${id}/files/edit/${encodePathSegments(name)}`);
                        }
                        resolve();
                    })
                    .catch((error) => {
                        console.error(error);
                        addError({ message: httpErrorToHuman(error), key: 'files:view' });
                        reject(error);
                    })
                    .finally(() => setLoading(false));
            }
        });
    };

    const saveAndRestart = async (name?: string) => {
        try {
            await save(name);
            if (instance) {
                // they'll stack immediately, so this'll ease that
                setTimeout(() => {
                    toast.success('Your server is restarting.');
                }, 500);
                instance.send('set state', 'restart');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (error) {
        return <div>An error occurred.</div>;
    }

    return (
        <PageContentBlock title={action === 'edit' ? `Editing ${filename}` : `New File`} className='p-0!'>
            <FlashMessageRender byKey={'files:view'} />

            <ErrorBoundary>
                <div
                    className={`flex py-6 bg-[#ffffff11] rounded-md rounded-b-none border-[1px] border-[#ffffff07] border-b-0`}
                >
                    <span className='-ml-[2rem]'></span>
                    <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                </div>
            </ErrorBoundary>

            {filename === '.pteroignore' ? (
                <div className={`mb-4 p-4 border-l-4 bg-neutral-900 rounded-sm border-cyan-400`}>
                    <p className={`text-neutral-300 text-sm`}>
                        You&apos;re editing a{' '}
                        <code className={`font-mono bg-black rounded-sm py-px px-1`}>.pteroignore</code> file. Any files
                        or directories listed in here will be excluded from backups. Wildcards are supported by using an
                        asterisk (<code className={`font-mono bg-black rounded-sm py-px px-1`}>*</code>). You can negate
                        a prior rule by prepending an exclamation point (
                        <code className={`font-mono bg-black rounded-sm py-px px-1`}>!</code>).
                    </p>
                </div>
            ) : null}

            <FileNameModal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                onFileNamed={(name) => {
                    setModalVisible(false);
                    save(name);
                }}
            />

            <div
                className={`relative h-full bg-[#ffffff11] border-[1px] border-[#ffffff07] border-t-0 [&>div>div]:h-full [&>div>div]:outline-hidden! w-full`}
            >
                <Editor
                    style={{ height: 'calc(100vh - 86px)', width: '100%' }}
                    filename={filename}
                    initialContent={content}
                    language={language}
                    onLanguageChanged={(l) => {
                        setLanguage(l);
                    }}
                    fetchContent={(value) => {
                        fetchFileContent = value;
                    }}
                    onContentSaved={() => {
                        if (action !== 'edit') {
                            setModalVisible(true);
                        } else {
                            save();
                        }
                    }}
                />
            </div>

            <div className={`flex flex-row items-center gap-4 absolute top-2.5 right-2`}>
                <DropdownMenu>
                    <DropdownMenuTrigger className='flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-md h-fit bg-[#ffffff11]'>
                        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
                            <path
                                d='M8 12H8.00897M11.9955 12H12.0045M15.991 12H16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M18 21C19.2322 21 20.231 19.8487 20.231 18.4286C20.231 16.1808 20.1312 14.6865 21.6733 12.9091C22.1089 12.407 22.1089 11.593 21.6733 11.0909C20.1312 9.31354 20.231 7.81916 20.231 5.57143C20.231 4.15127 19.2322 3 18 3'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M6 21C4.76784 21 3.76897 19.8487 3.76897 18.4286C3.76897 16.1808 3.86877 14.6865 2.32673 12.9091C1.89109 12.407 1.89109 11.593 2.32673 11.0909C3.83496 9.35251 3.76897 7.83992 3.76897 5.57143C3.76897 4.15127 4.76784 3 6 3'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                        {language?.name ?? 'Language'}
                        <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 13 13' fill='none'>
                            <path
                                fillRule='evenodd'
                                clipRule='evenodd'
                                d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                fill='white'
                                fillOpacity='0.37'
                            />
                        </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='max-h-[calc(100vh-4rem)] overflow-auto z-99999' sideOffset={8}>
                        <For each={languages.sort((a, b) => a.name.localeCompare(b.name))} memo>
                            {(language) => (
                                <DropdownMenuItem
                                    key={language.name}
                                    onSelect={() => {
                                        setLanguage(languages.find((l) => l.name === language.name));
                                    }}
                                >
                                    {language.name}
                                </DropdownMenuItem>
                            )}
                        </For>
                    </DropdownMenuContent>
                </DropdownMenu>

                {action === 'edit' ? (
                    <Can action={'file.update'}>
                        <div className='flex gap-1 items-center justify-center'>
                            <button
                                style={{
                                    background:
                                        'radial-gradient(109.26% 109.26% at 49.83% 13.37%, rgb(255, 52, 60) 0%, rgb(240, 111, 83) 100%)',
                                }}
                                className='h-[46px] pl-8 pr-6 py-3 border-[1px] border-[#ffffff12] rounded-l-full text-sm font-bold shadow-md cursor-pointer'
                                onClick={() => save()}
                            >
                                Save <span className='ml-2 font-mono text-xs font-bold uppercase'>CTRL + S</span>
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    style={{
                                        background:
                                            'radial-gradient(109.26% 109.26% at 49.83% 13.37%, rgb(255, 52, 60) 0%, rgb(240, 111, 83) 100%)',
                                    }}
                                    className='h-[46px] px-2 py-3 border-[1px] border-[#ffffff12] rounded-r-full text-sm font-bold shadow-md'
                                >
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='13'
                                        height='13'
                                        viewBox='0 0 13 13'
                                        fill='none'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            clipRule='evenodd'
                                            d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                            fill='white'
                                        />
                                    </svg>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className='max-h-[calc(100vh-4rem)] overflow-auto z-99999'
                                    sideOffset={8}
                                >
                                    <DropdownMenuItem onSelect={() => saveAndRestart()}>
                                        Save & Restart
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Can>
                ) : (
                    <Can action={'file.create'}>
                        <button
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                            }}
                            className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md cursor-pointer'
                            onClick={() => setModalVisible(true)}
                        >
                            Create File
                        </button>
                    </Can>
                )}
            </div>
        </PageContentBlock>
    );
};
