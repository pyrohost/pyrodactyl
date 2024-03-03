import { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
// import style from './style.module.css';
import NewFileButton from './NewFileButton';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1]?.name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <div className='flex flex-row justify-between items-center mb-8'>
                    <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Files</h1>
                    <Can action={'file.create'}>
                        <div className='flex flex-row gap-1'>
                            <FileManagerStatus />
                            <NewDirectoryButton />
                            <NewFileButton id={id} />
                            <UploadButton />
                        </div>
                    </Can>
                </div>
                <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                    <FileManagerBreadcrumbs
                        renderLeft={
                            <FileActionCheckbox
                                type={'checkbox'}
                                className='ml-6 mr-4'
                                // todo: find a user friendly way to implement this
                                // css={tw`opacity-0 -ml-8 mr-4`}
                                // className='group-hover:opacity-100 group-focus:opacity-100 group-hover:ml-6'
                                checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                onChange={onSelectAllClick}
                            />
                        }
                    />
                </div>
            </ErrorBoundary>
            {!files ? (
                // <Spinner size={'large'} centered />
                <></>
            ) : (
                <>
                    {!files.length ? (
                        <p css={tw`text-sm text-zinc-400 text-center`}>This directory seems to be empty.</p>
                    ) : (
                        // <CSSTransition classNames={'fade'} timeout={150} appear in>
                        <>
                            {files.length > 250 && (
                                <div css={tw`rounded bg-yellow-400 mb-px p-3`}>
                                    <p css={tw`text-yellow-900 text-sm text-center`}>
                                        This directory is too large to display in the browser, limiting the output to
                                        the first 250 files.
                                    </p>
                                </div>
                            )}
                            <div
                                data-pyro-file-manager-files
                                style={{
                                    background:
                                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                                }}
                                className='p-1 border-[1px] border-[#ffffff12] rounded-xl'
                            >
                                <div className='w-full h-full overflow-hidden rounded-lg flex flex-col gap-1'>
                                    {sortFiles(files.slice(0, 250)).map((file) => (
                                        <FileObjectRow key={file.key} file={file} />
                                    ))}
                                </div>
                            </div>
                            <MassActionsBar />
                        </>
                        // </CSSTransition>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};
