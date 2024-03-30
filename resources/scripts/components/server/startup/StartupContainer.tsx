import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

import CopyOnClick from '@/components/elements/CopyOnClick';
import Input from '@/components/elements/Input';
import InputSpinner from '@/components/elements/InputSpinner';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import { ServerError } from '@/components/elements/ScreenBlock';
import Select from '@/components/elements/Select';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import VariableBox from '@/components/server/startup/VariableBox';

import { httpErrorToHuman } from '@/api/http';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuRadioGroup,
//     DropdownMenuRadioItem,
//     DropdownMenuTrigger,
// } from '@/components/elements/DropdownMenu';
import useFlash from '@/plugins/useFlash';

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

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

    const updateSelectedDockerImage = useCallback(
        (v: React.ChangeEvent<HTMLSelectElement>) => {
            setLoading(true);
            clearFlashes('startup:image');

            const image = v.currentTarget.value;
            setSelectedDockerImage(uuid, image)
                .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:image', error });
                })
                .then(() => setLoading(false));
        },
        [uuid],
    );

    return !data ? (
        !error || (error && isValidating) ? (
            <Spinner centered size={Spinner.Size.LARGE} />
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} />
        )
    ) : (
        <ServerContentBlock title={'Startup Settings'} showFlashKey={'startup:image'}>
            <MainPageHeader direction='column' title='Startup Settings'>
                <h2 className='text-sm'>
                    These settings are used to control how your server starts up. Please be careful when modifying these
                    settings as they can cause your server to become inoperable.
                </h2>
            </MainPageHeader>
            <div className={`flex flex-col gap-8`}>
                <TitledGreyBox title={'Startup Command'} className={`flex-1`}>
                    <CopyOnClick text={data.invocation}>
                        <div className={`px-1 py-2`}>
                            <p className={`font-mono bg-zinc-900 rounded py-2 px-4`}>{data.invocation}</p>
                        </div>
                    </CopyOnClick>
                </TitledGreyBox>
                <TitledGreyBox title={'Docker Image'} className={`flex-1 lg:flex-none lg:w-1/3 mt-8 md:mt-0 md:ml-10`}>
                    {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                        <>
                            <InputSpinner visible={loading}>
                                <Select
                                    className='w-full bg-[#ffffff11] p-4 appearance-none rounded-2xl'
                                    disabled={Object.keys(data.dockerImages).length < 2}
                                    onChange={updateSelectedDockerImage}
                                    defaultValue={variables.dockerImage}
                                >
                                    {Object.keys(data.dockerImages).map((key) => (
                                        <option
                                            className='bg-black'
                                            key={data.dockerImages[key]}
                                            value={data.dockerImages[key]}
                                        >
                                            {key}
                                        </option>
                                    ))}
                                </Select>
                            </InputSpinner>
                            {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className='flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-md bg-[#ffffff11]'>
                                        <div>Select Image</div>
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
                                <DropdownMenuContent className='flex flex-col gap-1 z-[99999]' sideOffset={8}>
                                    <DropdownMenuRadioGroup
                                        value={variables.dockerImage}
                                        onValueChange={() => updateSelectedDockerImage}
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
                            </DropdownMenu> */}
                            <p className={`text-xs mt-2`}>
                                This is an advanced feature allowing you to select a Docker image to use when running
                                this server instance.
                            </p>
                        </>
                    ) : (
                        <>
                            <Input disabled readOnly value={variables.dockerImage} />
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
            <h3 className={`mt-8 mb-2 text-2xl font-extrabold`}>Variables</h3>
            <div className={`grid gap-8 md:grid-cols-2`}>
                {data.variables.map((variable) => (
                    <VariableBox key={variable.envVariable} variable={variable} />
                ))}
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
