import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import InputSpinner from '@/components/elements/InputSpinner';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import { ServerError } from '@/components/elements/ScreenBlock';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Dialog } from '@/components/elements/dialog';
import VariableBox from '@/components/server/startup/VariableBox';

import { httpErrorToHuman } from '@/api/http';
import processStartupCommand from '@/api/server/processStartupCommand';
import resetStartupCommand from '@/api/server/resetStartupCommand';
import revertDockerImage from '@/api/server/revertDockerImage';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import updateStartupCommand from '@/api/server/updateStartupCommand';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const [commandLoading, setCommandLoading] = useState(false);
    const [editingCommand, setEditingCommand] = useState(false);
    const [commandValue, setCommandValue] = useState('');
    const [liveProcessedCommand, setLiveProcessedCommand] = useState('');
    const [revertModalVisible, setRevertModalVisible] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [canEditCommand] = usePermissions(['startup.command']);
    const [canEditDockerImage] = usePermissions(['startup.docker-image']);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data!, isEqual);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual,
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
        rawStartupCommand: '',
    });

    const ITEMS_PER_PAGE = 6;
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedVariables = data
        ? data.variables.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        : [];

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => {
        mutate();
    }, [mutate]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const updateSelectedDockerImage = (image: string) => {
        setLoading(true);
        clearFlashes('startup:image');

        setSelectedDockerImage(uuid, image)
            .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:image', error });
            })
            .then(() => setLoading(false));
    };

    const revertToEggDefault = () => {
        setLoading(true);
        clearFlashes('startup:image');

        revertDockerImage(uuid)
            .then(() => {
                // Get the first docker image from the egg as the default
                const defaultImage = data ? Object.values(data.dockerImages)[0] || '' : '';
                setServerFromState((s) => ({ ...s, dockerImage: defaultImage }));
                setRevertModalVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:image', error });
            })
            .then(() => setLoading(false));
    };

    const updateCommand = () => {
        setCommandLoading(true);
        clearFlashes('startup:command');

        updateStartupCommand(uuid, commandValue)
            .then((invocation) => {
                mutate(
                    (data) => ({
                        ...data!,
                        invocation,
                        rawStartupCommand: commandValue,
                    }),
                    false,
                );
                setEditingCommand(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:command', error });
            })
            .then(() => setCommandLoading(false));
    };

    const loadDefaultCommand = async () => {
        try {
            const defaultCommand = await resetStartupCommand(uuid);
            setCommandValue(defaultCommand);
            const processed = await processCommandLive(defaultCommand);
            setLiveProcessedCommand(processed);
        } catch (error) {
            console.error('Failed to load default command:', error);
        }
    };

    const processCommandLive = async (rawCommand: string): Promise<string> => {
        try {
            return await processStartupCommand(uuid, rawCommand);
        } catch (error) {
            console.error('Failed to process command:', error);
            return rawCommand;
        }
    };

    const startEditingCommand = async () => {
        const initialCommand = data?.rawStartupCommand || '';
        setCommandValue(initialCommand);
        const processed = await processCommandLive(initialCommand);
        setLiveProcessedCommand(processed);
        setEditingCommand(true);
    };

    const cancelEditingCommand = () => {
        setEditingCommand(false);
        setCommandValue('');
        setLiveProcessedCommand('');
    };

    const handleCommandChange = async (value: string) => {
        setCommandValue(value);
        const processed = await processCommandLive(value);
        setLiveProcessedCommand(processed);
    };

    return !data ? (
        !error || (error && isValidating) ? (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <div className='flex flex-col items-center gap-4'>
                    <Spinner centered size={Spinner.Size.LARGE} />
                    <p className='text-sm text-neutral-400'>Loading startup configuration...</p>
                </div>
            </div>
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} />
        )
    ) : (
        <ServerContentBlock title={'Startup Settings'} showFlashKey={'startup:image'}>
            <Dialog.Confirm
                open={revertModalVisible}
                title={'Revert Docker Image'}
                confirm={'Yes, revert to default'}
                onClose={() => setRevertModalVisible(false)}
                onConfirmed={revertToEggDefault}
                loading={loading}
            >
                <div className='space-y-3'>
                    <p>
                        This will revert your server&apos;s Docker image back to the egg&apos;s default specification.
                    </p>
                    <div className='bg-linear-to-b from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-3'>
                        <p className='text-sm text-amber-200'>
                            <span className='font-medium'>⚠️ Warning:</span> You will not be able to set a custom image
                            back without contacting support.
                        </p>
                    </div>
                    <p className='text-sm text-neutral-400'>Are you sure you want to continue?</p>
                </div>
            </Dialog.Confirm>
            <div className='space-y-6'>
                <MainPageHeader direction='column' title='Startup Settings'>
                    <p className='text-sm text-neutral-400 leading-relaxed'>
                        Configure how your server starts up. These settings control the startup command and environment
                        variables.
                        <span className='text-amber-400 font-medium'>
                            {' '}
                            Exercise caution when modifying these settings.
                        </span>
                    </p>
                </MainPageHeader>

                <div className='space-y-6'>
                    <TitledGreyBox title={'Startup Command'} className='p-6'>
                        <div className='space-y-4 mb-6'>
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                Configure the command that starts your server. You can edit the raw command or view the
                                processed version with variables resolved.
                            </p>
                        </div>
                        {editingCommand ? (
                            <div className='space-y-4'>
                                <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6'>
                                    <div>
                                        <label className='block text-sm font-medium text-neutral-300 mb-3'>
                                            Raw Command
                                        </label>
                                        <textarea
                                            className='w-full h-32 sm:h-36 md:h-40 px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base font-mono bg-linear-to-b from-[#ffffff12] to-[#ffffff08] border-2 border-blue-500/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 placeholder:text-neutral-500 transition-all touch-manipulation'
                                            value={commandValue}
                                            onChange={(e) => handleCommandChange(e.target.value)}
                                            placeholder='Enter startup command with variables like {{SERVER_MEMORY}} or {{SERVER_PORT}}...'
                                            style={{
                                                wordBreak: 'break-all',
                                                overflowWrap: 'break-word',
                                                whiteSpace: 'pre-wrap',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-neutral-300 mb-3'>
                                            Live Preview
                                        </label>
                                        <CopyOnClick text={liveProcessedCommand}>
                                            <div className='cursor-pointer group'>
                                                <div className='w-full h-32 sm:h-36 md:h-40 px-3 py-3 sm:px-4 sm:py-4 font-mono bg-linear-to-b from-[#ffffff06] to-[#ffffff03] border-2 border-green-500/20 rounded-xl text-sm sm:text-base overflow-auto group-hover:border-green-500/40 transition-all'>
                                                    <span
                                                        className='break-all text-green-200'
                                                        style={{
                                                            wordBreak: 'break-all',
                                                            overflowWrap: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                        }}
                                                    >
                                                        {liveProcessedCommand ||
                                                            'Enter a command to see the live preview...'}
                                                    </span>
                                                </div>
                                            </div>
                                        </CopyOnClick>
                                    </div>
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-[#ffffff08]'>
                                    <InputSpinner visible={commandLoading}>
                                        <ActionButton
                                            variant='primary'
                                            size='md'
                                            onClick={updateCommand}
                                            disabled={commandLoading || !commandValue.trim()}
                                            className='w-full sm:w-auto sm:flex-1 lg:flex-none lg:min-w-[140px]'
                                        >
                                            {commandLoading && <Spinner size='small' />}
                                            {commandLoading ? 'Saving...' : 'Save Command'}
                                        </ActionButton>
                                    </InputSpinner>
                                    <ActionButton
                                        variant='secondary'
                                        size='md'
                                        onClick={loadDefaultCommand}
                                        disabled={commandLoading}
                                        className='w-full sm:w-auto sm:flex-1 lg:flex-none lg:min-w-[140px]'
                                    >
                                        Load Default
                                    </ActionButton>
                                    <ActionButton
                                        variant='secondary'
                                        size='md'
                                        onClick={cancelEditingCommand}
                                        disabled={commandLoading}
                                        className='w-full sm:w-auto sm:flex-1 lg:flex-none lg:min-w-[140px]'
                                    >
                                        Cancel
                                    </ActionButton>
                                </div>
                            </div>
                        ) : (
                            <div className='space-y-5'>
                                {data.rawStartupCommand && (
                                    <div className='space-y-3'>
                                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                                            <label className='text-sm font-medium text-neutral-300'>Raw Command</label>
                                            {canEditCommand && (
                                                <ActionButton
                                                    variant='secondary'
                                                    size='sm'
                                                    onClick={startEditingCommand}
                                                    className='w-full sm:w-auto'
                                                >
                                                    Edit Command
                                                </ActionButton>
                                            )}
                                        </div>
                                        <CopyOnClick text={data.rawStartupCommand}>
                                            <div className='cursor-pointer group'>
                                                <div className='font-mono bg-linear-to-b from-[#ffffff08] to-[#ffffff05] flex flex-row items-center border border-[#ffffff10] rounded-xl py-3 px-3 sm:py-4 sm:px-4 text-sm sm:text-base min-h-[3.5rem] sm:min-h-[4rem] overflow-auto group-hover:border-[#ffffff20] transition-all'>
                                                    <span
                                                        className='break-all text-neutral-200'
                                                        style={{
                                                            wordBreak: 'break-all',
                                                            overflowWrap: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                        }}
                                                    >
                                                        {data.rawStartupCommand}
                                                    </span>
                                                </div>
                                            </div>
                                        </CopyOnClick>
                                    </div>
                                )}
                                <div className='space-y-3'>
                                    <div className='flex flex-col items-center sm:flex-row gap-2'>
                                        <label className='text-sm font-medium text-neutral-300'>
                                            Processed Command
                                        </label>
                                        <span className='text-xs text-neutral-500 rounded w-fit'>Read-only</span>
                                    </div>
                                    <CopyOnClick text={data.invocation}>
                                        <div className='cursor-pointer group'>
                                            <div className='font-mono bg-linear-to-b from-[#ffffff04] to-[#ffffff02] flex flex-row items-center border border-[#ffffff08] rounded-xl py-3 px-3 sm:py-4 sm:px-4 text-sm sm:text-base min-h-[3.5rem] sm:min-h-[4rem] overflow-auto group-hover:border-[#ffffff15] transition-all'>
                                                <span
                                                    className='break-all text-neutral-300'
                                                    style={{
                                                        wordBreak: 'break-all',
                                                        overflowWrap: 'break-word',
                                                        whiteSpace: 'pre-wrap',
                                                    }}
                                                >
                                                    {data.invocation}
                                                </span>
                                            </div>
                                        </div>
                                    </CopyOnClick>
                                </div>
                            </div>
                        )}
                    </TitledGreyBox>

                    <TitledGreyBox title={'Docker Image'} className='p-6'>
                        <div className='space-y-4 mb-6'>
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                The container image used to run your server. Different images provide different software
                                versions and configurations.
                            </p>
                        </div>
                        {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                            <div className='space-y-4'>
                                <InputSpinner visible={loading}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className='w-full flex items-center justify-between gap-3 font-medium text-sm sm:text-base px-3 py-3 sm:px-4 sm:py-3 rounded-md bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] hover:from-[#ffffff15] hover:to-[#ffffff10] hover:border-[#ffffff25] transition-all cursor-pointer touch-manipulation'>
                                                <span className='truncate text-left font-mono text-neutral-200'>
                                                    {Object.keys(data.dockerImages).find(
                                                        (key) => data.dockerImages[key] === variables.dockerImage,
                                                    ) || variables.dockerImage}
                                                </span>
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 13 13'
                                                    fill='none'
                                                    className='flex-shrink-0 opacity-60'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        clipRule='evenodd'
                                                        d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                                        fill='white'
                                                        fillOpacity='0.6'
                                                    />
                                                </svg>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='flex flex-col gap-1 z-99999' sideOffset={8}>
                                            <DropdownMenuRadioGroup
                                                value={variables.dockerImage}
                                                onValueChange={(value) => updateSelectedDockerImage(value)}
                                            >
                                                {Object.keys(data.dockerImages).map((key) => (
                                                    <DropdownMenuRadioItem
                                                        value={data.dockerImages[key] as string}
                                                        key={data.dockerImages[key]}
                                                    >
                                                        {key}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </InputSpinner>
                            </div>
                        ) : (
                            <div className='space-y-4'>
                                <div className='bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff10] rounded-xl py-3 px-3 sm:py-4 sm:px-4 overflow-auto'>
                                    <span
                                        className='text-sm sm:text-base font-mono break-all text-neutral-200'
                                        style={{
                                            wordBreak: 'break-all',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {Object.keys(data.dockerImages).find(
                                            (key) => data.dockerImages[key] === variables.dockerImage,
                                        ) || variables.dockerImage}
                                    </span>
                                </div>
                                {isCustomImage && (
                                    <div className='bg-linear-to-b from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-3 sm:p-4'>
                                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                                            <div className='flex-1'>
                                                <p className='text-sm text-amber-200'>
                                                    <span className='font-medium'>Notice:</span> This server&apos;s
                                                    Docker image has been manually set by an administrator and cannot be
                                                    changed through this interface.
                                                </p>
                                                {canEditDockerImage && (
                                                    <p className='text-xs text-amber-300/80 mt-2'>
                                                        You can revert to the egg&apos;s default image, but you
                                                        won&apos;t be able to set it back without contacting support.
                                                    </p>
                                                )}
                                            </div>
                                            {canEditDockerImage && (
                                                <div className='flex-shrink-0'>
                                                    <InputSpinner visible={loading}>
                                                        <ActionButton
                                                            variant='secondary'
                                                            size='sm'
                                                            onClick={() => setRevertModalVisible(true)}
                                                            disabled={loading}
                                                            className='w-full sm:w-auto text-amber-200 bg-linear-to-b from-amber-600/20 to-amber-700/20 border-amber-500/40 hover:from-amber-500/30 hover:to-amber-600/30 hover:border-amber-500/60 hover:text-amber-100'
                                                        >
                                                            {loading && <Spinner size='small' />}
                                                            Revert to Default
                                                        </ActionButton>
                                                    </InputSpinner>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </TitledGreyBox>
                </div>

                {data && data.variables.length > 0 && (
                    <div className='space-y-6'>
                        <div className='space-y-3'>
                            <h3 className='text-2xl font-extrabold text-neutral-200'>Environment Variables</h3>
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                Configure environment variables that will be available to your server. These variables
                                can be used to customize server behavior and settings.
                            </p>
                        </div>

                        <div className='bg-linear-to-b from-[#ffffff04] to-[#ffffff02] border border-[#ffffff08] rounded-xl p-4'>
                            <div className='space-y-3'>
                                <h4 className='text-sm font-medium text-neutral-300'>Global Server Variables</h4>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs'>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_MEMORY'}</span>
                                        <CopyOnClick text={server?.limits?.memory || 'null'}>
                                            <span className='text-neutral-300 font-mono'>
                                                {server?.limits?.memory || 'null'}
                                            </span>
                                        </CopyOnClick>
                                    </div>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_IP'}</span>
                                        <CopyOnClick text={server?.allocations?.find((a) => a.isDefault)?.ip || 'null'}>
                                            <span className='text-neutral-300 font-mono'>
                                                {server?.allocations?.find((a) => a.isDefault)?.ip || 'null'}
                                            </span>
                                        </CopyOnClick>
                                    </div>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_PORT'}</span>
                                        <CopyOnClick
                                            text={server?.allocations?.find((a) => a.isDefault)?.port || 'null'}
                                        >
                                            <span className='text-neutral-300 font-mono'>
                                                {server?.allocations?.find((a) => a.isDefault)?.port || 'null'}
                                            </span>
                                        </CopyOnClick>
                                    </div>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_UUID'}</span>
                                        <CopyOnClick text={uuid}>
                                            <span className='text-neutral-300 font-mono text-xs truncate'>{uuid}</span>
                                        </CopyOnClick>
                                    </div>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_NAME'}</span>
                                        <CopyOnClick text={server?.name || 'null'}>
                                            <span className='text-neutral-300 font-mono truncate'>
                                                {server?.name || 'null'}
                                            </span>
                                        </CopyOnClick>
                                    </div>
                                    <div className='flex justify-between items-center gap-2 py-2 px-3 bg-[#ffffff06] rounded border border-[#ffffff08]'>
                                        <span className='font-mono text-neutral-400'>{'SERVER_CPU'}</span>
                                        <CopyOnClick text={server?.limits?.cpu || 'null'}>
                                            <span className='text-neutral-300 font-mono'>
                                                {server?.limits?.cpu || 'null'}
                                            </span>
                                        </CopyOnClick>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='min-h-[40svh] flex flex-col justify-between'>
                            <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'>
                                {paginatedVariables.map((variable) => (
                                    <VariableBox key={variable.envVariable} variable={variable} />
                                ))}
                            </div>
                            {data.variables.length > ITEMS_PER_PAGE && (
                                <div className='mt-6 pt-4 border-t border-[#ffffff10]'>
                                    <Pagination
                                        data={{
                                            items: paginatedVariables,
                                            pagination: {
                                                currentPage,
                                                totalPages: Math.ceil(data.variables.length / ITEMS_PER_PAGE),
                                                total: data.variables.length,
                                                count: data.variables.length,
                                                perPage: ITEMS_PER_PAGE,
                                            },
                                        }}
                                        onPageSelect={setCurrentPage}
                                    >
                                        {() => <></>}
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
