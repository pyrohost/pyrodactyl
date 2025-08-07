import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

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
import VariableBox from '@/components/server/startup/VariableBox';

import { httpErrorToHuman } from '@/api/http';
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
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [canEditCommand] = usePermissions(['startup.command']);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
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
        // Since we're passing in initial data this will not trigger on mount automatically. We
        // want to always fetch fresh information from the API however when we're loading the startup
        // information.
        mutate();
    }, []);

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

    const startEditingCommand = () => {
        setCommandValue(data?.rawStartupCommand || '');
        setEditingCommand(true);
    };

    const cancelEditingCommand = () => {
        setEditingCommand(false);
        setCommandValue('');
    };

    return !data ? (
        !error || (error && isValidating) ? (
            <Spinner centered size={Spinner.Size.LARGE} />
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} />
        )
    ) : (
        <ServerContentBlock title={'Startup Settings'} showFlashKey={['startup:image', 'startup:command']}>
            <MainPageHeader direction='column' title='Startup Settings'>
                <h2 className='text-sm'>
                    These settings are used to control how your server starts up. Please be careful when modifying these
                    settings as they can cause your server to become inoperable.
                </h2>
            </MainPageHeader>
            <div className={`flex gap-8 lg:flex-row flex-col`}>
                <TitledGreyBox title={'Startup Command'} className={`col-span-2`}>
                    {editingCommand ? (
                        <div className={`space-y-4`}>
                            <div className={`space-y-2`}>
                                <label className={`text-sm font-medium text-neutral-300`}>Raw Startup Command</label>
                                <textarea
                                    className={`w-full h-24 px-3 py-2 text-sm font-mono bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#ffffff15] focus:border-transparent placeholder:text-muted-foreground`}
                                    value={commandValue}
                                    onChange={(e) => setCommandValue(e.target.value)}
                                    placeholder="Enter startup command..."
                                />
                            </div>
                            <div className={`flex gap-2`}>
                                <InputSpinner visible={commandLoading}>
                                    <button
                                        onClick={updateCommand}
                                        disabled={commandLoading || !commandValue.trim()}
                                        className={`px-4 py-2 text-sm font-medium text-white bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-xl hover:from-[#ffffff15] hover:to-[#ffffff10] disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                    >
                                        Save Command
                                    </button>
                                </InputSpinner>
                                <button
                                    onClick={cancelEditingCommand}
                                    disabled={commandLoading}
                                    className={`px-4 py-2 text-sm font-medium text-neutral-300 bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff10] rounded-xl hover:from-[#ffffff10] hover:to-[#ffffff08] disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`space-y-4`}>
                            <div className={`space-y-2`}>
                                <div className={`flex items-center justify-between`}>
                                    <label className={`text-sm font-medium text-neutral-300`}>Processed Command</label>
                                    {canEditCommand && (
                                        <button
                                            onClick={startEditingCommand}
                                            className={`px-3 py-1 text-xs font-medium text-white bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-xl hover:from-[#ffffff15] hover:to-[#ffffff10] transition-colors`}
                                        >
                                            Edit Raw Command
                                        </button>
                                    )}
                                </div>
                                <CopyOnClick text={data.invocation}>
                                    <div className={`px-1 py-2`}>
                                        <p className={`font-mono bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff10] rounded-xl py-2 px-4 text-sm`}>{data.invocation}</p>
                                    </div>
                                </CopyOnClick>
                            </div>
                            {data.rawStartupCommand && (
                                <div className={`space-y-2`}>
                                    <label className={`text-sm font-medium text-neutral-300`}>Raw Command</label>
                                    <CopyOnClick text={data.rawStartupCommand}>
                                        <div className={`px-1 py-2`}>
                                            <p className={`font-mono bg-linear-to-b from-[#ffffff05] to-[#ffffff03] border border-[#ffffff08] rounded-xl py-2 px-4 text-sm text-neutral-400`}>{data.rawStartupCommand}</p>
                                        </div>
                                    </CopyOnClick>
                                </div>
                            )}
                        </div>
                    )}
                </TitledGreyBox>
                <TitledGreyBox title={'Docker Image'} className='min-w-80'>
                    {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                        <>
                            <InputSpinner visible={loading}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className='flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-xl bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] hover:from-[#ffffff15] hover:to-[#ffffff10] transition-colors cursor-pointer'>
                                            <div>{variables.dockerImage}</div>
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
                                                    fillOpacity='0.37'
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
                            <p className={`text-xs mt-2`}>
                                This is an advanced feature allowing you to select a Docker image to use when running
                                this server instance.
                            </p>
                        </>
                    ) : (
                        <>
                            <span className={`text-neutral-400`}>{variables.dockerImage}</span>
                            {isCustomImage && (
                                <p className={`text-xs text-zinc-300 mt-2`}>
                                    This {"server's"} Docker image has been manually set by an administrator and cannot
                                    be changed through this UI.
                                </p>
                            )}
                        </>
                    )}
                </TitledGreyBox>
            </div>
            {data && (
                <>
                    <h3 className={`mt-8 mb-6 text-2xl font-extrabold`}>Variables</h3>
                    <div className='h-[47svh] flex flex-col justify-between'>
                        <div className={`grid gap-4 md:grid-cols-2`}>
                            {paginatedVariables.map((variable) => (
                                <VariableBox key={variable.envVariable} variable={variable} />
                            ))}
                        </div>
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
                </>
            )}
        </ServerContentBlock>
    );
};

export default StartupContainer;
