import type { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { dirname } from 'pathe';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { httpErrorToHuman } from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileNameModal from '@/components/server/files/FileNameModal';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { Editor } from '@/components/elements/editor';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { encodePathSegments } from '@/helpers';
import { toast } from 'sonner';

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
        if (!fetchFileContent) {
            return;
        }

        setLoading(true);
        toast(`Saving ${name ?? filename}...`);
        clearFlashes('files:view');
        fetchFileContent()
            .then((content) => saveFileContents(uuid, name ?? filename, content))
            .then(() => {
                if (name) {
                    navigate(`/server/${id}/files/edit/${encodePathSegments(name)}`);
                    return;
                }

                return Promise.resolve();
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view' });
            })
            .then(() => setLoading(false))
            .then(() => toast.success(`Saved ${name ?? filename}!`));
    };

    if (error) {
        // TODO: onBack
        return <div>An error occurred.</div>;
    }

    return (
        <PageContentBlock className='!p-0'>
            <FlashMessageRender byKey={'files:view'} />

            <ErrorBoundary>
                <div className={`py-4`}>
                    <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                </div>
            </ErrorBoundary>

            {filename === '.pteroignore' ? (
                <div className={`mb-4 p-4 border-l-4 bg-neutral-900 rounded border-cyan-400`}>
                    <p className={`text-neutral-300 text-sm`}>
                        You&apos;re editing a{' '}
                        <code className={`font-mono bg-black rounded py-px px-1`}>.pteroignore</code> file. Any files or
                        directories listed in here will be excluded from backups. Wildcards are supported by using an
                        asterisk (<code className={`font-mono bg-black rounded py-px px-1`}>*</code>). You can negate a
                        prior rule by prepending an exclamation point (
                        <code className={`font-mono bg-black rounded py-px px-1`}>!</code>).
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

            <div className={`relative h-full [&>div>div]:h-full [&>div>div]:!outline-none w-full`}>
                <Editor
                    style={{ height: 'calc(100vh - 68px)', width: '100%' }}
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

            <div className={`flex flex-row absolute top-2 right-2`}>
                <div className={`flex-1 sm:flex-none rounded mr-4`}>
                    <select
                        className='h-full rounded-md bg-[#ffffff12] text-white px-4 py-3 text-sm font-bold shadow-md w-full appearance-none'
                        value={language?.name ?? ''}
                        onChange={(e) => {
                            setLanguage(languages.find((l) => l.name === e.target.value));
                        }}
                    >
                        {languages.map((language) => (
                            <option className='bg-black' key={language.name} value={language.name}>
                                {language.name}
                            </option>
                        ))}
                    </select>
                </div>

                {action === 'edit' ? (
                    <Can action={'file.update'}>
                        <button
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                            }}
                            className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md'
                            onClick={() => save()}
                        >
                            Save File
                        </button>
                    </Can>
                ) : (
                    <Can action={'file.create'}>
                        <button
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                            }}
                            className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md'
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
