import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';

import Button from '@/components/elements/ButtonV2';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Switch } from '@/components/elements/SwitchV2';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';
import VariableBox from '@/components/server/startup/VariableBox';

import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import createServerBackup from '@/api/server/backups/createServerBackup';
import deleteFiles from '@/api/server/files/deleteFiles';
import reinstallServer from '@/api/server/reinstallServer';
import setSelectedEggImage from '@/api/server/setSelectedEggImage';
import getServerBackups from '@/api/swr/getServerBackups';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';

interface Egg {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
}

interface Nest {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
}

const MAX_DESCRIPTION_LENGTH = 100;
const steps = [
    {
        slug: 'game',
        title: 'Game',
    },
    {
        slug: 'software',
        title: 'Software',
    },
    {
        slug: 'options-variables',
        title: 'Options & Variables',
    },
];
const hidden_nest_prefix = '!';
const blank_egg_prefix = '@';

const SoftwareContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [nests, setNests] = useState<Nest[]>();
    const eggs = nests?.reduce(
        (eggArray, nest) => [...eggArray, ...nest.attributes.relationships.eggs.data],
        [] as Egg[],
    );
    const currentEgg = ServerContext.useStoreState((state) => state.server.data!.egg);
    const originalEgg = currentEgg;
    const currentEggName =
        nests &&
        nests
            .find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg))
            ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg)?.attributes.name;
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);
    const { data: backups } = getServerBackups();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { data: files, mutate: filemutate } = useFileManagerSwr();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };

        fetchData();
    }, []);

    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual,
    );

    const { data, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    useEffect(() => {
        mutate();
        filemutate();
    }, []);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const ITEMS_PER_PAGE = 6;
    const [currentPage, setCurrentPage] = useState(1);

    let paginatedVariables;

    const updateVarsData = () => {
        paginatedVariables = data
            ? data.variables.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            : [];
    };

    updateVarsData();

    const [step, setStep] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [visible, setVisible] = useState(false);

    const [shouldBackup, setShouldBackup] = useState(false);
    const [shouldWipe, setShouldWipe] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [showFullDescriptions, setShowFullDescriptions] = useState<boolean[]>([]);

    useEffect(() => {
        if (backups) {
            if (backupLimit <= 0 || backups.backupCount >= backupLimit) {
                setShouldBackup(false);
            }
        }
    }, [backups, backupLimit]);

    const restoreOriginalEgg = () => {
        if (!nests || !eggs) return;
        const originalNestId =
            nests?.findIndex((nest) =>
                nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === originalEgg),
            ) + 1 || 0;
        const originalEggId = eggs?.find((eo) => eo.attributes.uuid === originalEgg)?.attributes.id || 0;

        setSelectedEggImage(uuid, originalEggId, originalNestId).catch((error) => {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        });
    };

    const reinstall = () => {
        reinstallServer(uuid)
            .then(() => {
                toast.success('Server has been reinstalled successfully.');
            })
            .catch((error) => {
                console.error(error);
                toast.error(httpErrorToHuman(error));
            });
    };

    const wipeFiles = async () => {
        filemutate();
        const selectedFiles = files?.map((file) => file.name) || [];
        if (selectedFiles.length === 0) return;

        await deleteFiles(uuid, directory, selectedFiles).catch((error) => {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        });
        return;
    };

    const handleNestSelect = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setStep(1);
    };

    const confirmSelection = async () => {
        if (shouldBackup) {
            await createServerBackup(uuid, {
                name: `${currentEggName} -> ${selectedEgg?.attributes.name} Migration - ${new Date().toLocaleString()}`,
                isLocked: false,
            }).catch((error) => {
                toast.error(httpErrorToHuman(error));
                return;
            });
        }
        if (shouldWipe) {
            wipeFiles();
        }

        reinstall();
    };

    const handleEggSelect = async (egg: Egg) => {
        if (!eggs || !nests || !selectedNest) return;
        setStep(2);

        // Use the passed egg directly instead of selectedEgg state
        const nestId = selectedNest.attributes.id;
        const eggId = egg.attributes.id;

        try {
            await setSelectedEggImage(uuid, eggId, nestId);
            await mutate();
            updateVarsData();
            setTimeout(() => setStep(2), 500);
        } catch (error) {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
            restoreOriginalEgg();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const toggleDescriptionVisibility = (index: number) => {
        setShowFullDescriptions((prev) => {
            const newVisibility = [...prev];
            newVisibility[index] = !newVisibility[index];
            return newVisibility;
        });
    };

    const renderEggDescription = (description: string, index: number) => {
        const isLongDescription = description.length > MAX_DESCRIPTION_LENGTH;
        const shouldShowFull = showFullDescriptions[index];

        return (
            <div>
                {isLongDescription && !shouldShowFull ? (
                    <>
                        {`${description.slice(0, MAX_DESCRIPTION_LENGTH)}... `}
                        <button
                            className='text-brand cursor-pointer'
                            onClick={() => toggleDescriptionVisibility(index)}
                        >
                            Show More
                        </button>
                    </>
                ) : (
                    <>
                        {description}
                        {isLongDescription && (
                            <button
                                className='text-brand cursor-pointer'
                                onClick={() => toggleDescriptionVisibility(index)}
                            >
                                <span className='text-neutral-400'>..</span>Show Less
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <ServerContentBlock title='Software'>
            <MainPageHeader direction='column' title='Software'>
                <h2 className='text-sm'>
                    Welcome to the software management page. Here you can change the game or software that is running on
                    your server.
                </h2>
            </MainPageHeader>

            {!visible && (
                <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08]'>
                    <div className='w-full h-full'>
                        <div className='flex items-center justify-between pb-4 p-2'>
                            <div className='flex items-center gap-2'>
                                <HugeIconsEggs fill='currentColor' />
                                <div className='flex flex-col'>
                                    <h1 className='text-2xl'>Current Egg</h1>
                                    {currentEggName &&
                                        (currentEggName?.includes(blank_egg_prefix) ? (
                                            <p className='text-neutral-300 text-sm'>Please select a egg</p>
                                        ) : (
                                            <p className='text-neutral-300 text-sm'>{currentEggName}</p>
                                        ))}
                                </div>
                            </div>
                            <button
                                className='rounded-full border-[1px] cursor-pointer border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg bg-linear-to-b from-[#ffffff10] to-[#ffffff09] text-white'
                                onClick={() => setVisible(true)}
                            >
                                Change Egg
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {visible && (
                <div className='relative rounded-xl shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] min-h-[500px] max-h-[90vh] overflow-y-auto'>
                    <div className='max-[480px]:flex max-[480px]:flex-col max-[480px]:items-center w-full h-full'>
                        <div className='flex max-[480px]:flex-col max-[480px]:gap-4 min-[480px]:items-center justify-between p-4 pr-5 mb-2'>
                            {steps.map((cstep, index) => (
                                <div
                                    key={cstep.slug}
                                    className={`${index !== steps.length - 1 ? 'w-full' : 'min-[480px]:w-[420px] min-[480px]:ml-4 min-[480px]:mr-4'} flex items-center gap-4`}
                                >
                                    <div
                                        className='flex items-center gap-2'
                                        onClick={() => setStep(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div
                                            className={`${index < step + 1 ? 'border-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-[#FF343C] to-[#F06F53] text-brand' : 'border-[#ffffff20] text-[#ffffff20]'} border-[2px] rounded-full p-1 w-8 h-8 text-sm font-bold shadow-md hover:shadow-lg items-center text-center`}
                                        >
                                            {index + 1}
                                        </div>
                                        <h2
                                            className={`${index < step + 1 ? 'text-white' : 'text-[#ffffff20]'} text-sm font-bold min-[480px]:whitespace-nowrap`}
                                        >
                                            {cstep.title}
                                        </h2>
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div
                                            className={`${index < step ? 'border-brand' : 'border-[#ffffff12]'} border-t-2 border-dashed ml-4 w-[75%] hidden min-[480px]:block`}
                                        ></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className='border-t border-[#ffffff20] m-4 mt-0 mb-0' />

                        <div className='p-4 pt-2'>
                            {step == 0 && (
                                <div>
                                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4'>
                                        {nests?.map((nest) =>
                                            nest.attributes.name.includes(hidden_nest_prefix) ? null : (
                                                <div
                                                    key={nest.attributes.uuid}
                                                    className={`cursor-pointer bg-[#3333332a] border-[1px] p-4 rounded-lg w-full text-left ${
                                                        selectedNest?.attributes.uuid === nest.attributes.uuid
                                                            ? 'border-[#555555ef]'
                                                            : 'border-[#55555540]'
                                                    }`}
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <p className='text-neutral-200 text-md'>
                                                            {nest.attributes.name}
                                                        </p>
                                                        <Button onClick={() => handleNestSelect(nest)}>Select</Button>
                                                    </div>
                                                    <p className='text-neutral-400 text-xs mt-2'>
                                                        {nest.attributes.description}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            {(step == 1 && selectedNest && (
                                <div>
                                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4'>
                                        {selectedNest.attributes.relationships.eggs.data.map((egg, eggIndex) => (
                                            <div
                                                key={egg.attributes.uuid}
                                                className={`cursor-pointer border p-4 rounded-lg bg-[#3333332a] w-full ${
                                                    selectedEgg?.attributes.uuid === egg.attributes.uuid
                                                        ? 'border-[#555555ef]'
                                                        : 'border-[#55555540]'
                                                }`}
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <p className='text-neutral-300 text-md'>{egg.attributes.name}</p>
                                                    <Button
                                                        onClick={async () => {
                                                            setSelectedEgg(egg);
                                                            await handleEggSelect(egg);
                                                        }}
                                                    >
                                                        Select
                                                    </Button>
                                                </div>
                                                <p className='text-neutral-400 text-xs mt-2'>
                                                    {renderEggDescription(egg.attributes.description, eggIndex)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) ||
                                (step == 1 && (
                                    <div className='flex items-center justify-center h-[63svh]'>
                                        <p className='text-neutral-300 '>Please select a game first</p>
                                    </div>
                                ))}

                            {(step == 2 && selectedEgg && !currentEggName?.includes(blank_egg_prefix) && (
                                <div className='flex flex-col gap-4'>
                                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4'>
                                        <div className='flex items-center justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg'>
                                            {backups && backupLimit > 0 && backups.backupCount < backupLimit ? (
                                                <>
                                                    <div className='flex flex-col'>
                                                        <label
                                                            htmlFor='backup'
                                                            className='text-neutral-300 text-md font-bold'
                                                        >
                                                            Backups
                                                        </label>
                                                        <label
                                                            htmlFor='backup'
                                                            className='text-neutral-500 text-sm font-semibold'
                                                        >
                                                            Would you like to create a backup before continuing? Some
                                                            data may be modified for removed during the process.
                                                        </label>
                                                    </div>
                                                    <Switch
                                                        name='backup'
                                                        defaultChecked={shouldBackup}
                                                        onCheckedChange={() => setShouldBackup(!shouldBackup)}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div className='flex flex-col'>
                                                        <label
                                                            htmlFor='backup'
                                                            className='text-neutral-300 text-md font-bold'
                                                        >
                                                            Backups
                                                        </label>
                                                        <label
                                                            htmlFor='backup'
                                                            className='text-neutral-500 text-sm font-semibold'
                                                        >
                                                            You have reached the backup limit for this server. If you
                                                            wish to create a backup cancel now and delete one or more
                                                            existing backups
                                                        </label>
                                                    </div>
                                                    <Switch name='backup' disabled />
                                                </>
                                            )}
                                        </div>
                                        <div className='flex items-center justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg'>
                                            <div className='flex flex-col'>
                                                <label htmlFor='wipe' className='text-neutral-300 text-md font-bold'>
                                                    Wipe Data
                                                </label>
                                                <label
                                                    htmlFor='wipe'
                                                    className='text-neutral-500 text-sm font-semibold'
                                                >
                                                    In some cases you might want to completely wipe your server like if
                                                    you are changing to a different game.
                                                </label>
                                            </div>
                                            <Switch
                                                name='wipe'
                                                defaultChecked={shouldWipe}
                                                onCheckedChange={() => setShouldWipe(!shouldWipe)}
                                            />
                                        </div>
                                    </div>

                                    <div className='border-t border-[#ffffff20]' />

                                    {data && (
                                        <div className='h-max lg:h-[39svh] flex flex-col justify-between'>
                                            <div className={`grid gap-2 grid-cols-1 lg:grid-cols-3`}>
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
                                    )}

                                    <div className='border-t border-[#ffffff20]' />

                                    <Button onClick={() => confirmSelection()}>Confirm</Button>
                                </div>
                            )) ||
                                (step == 2 && !currentEggName?.includes(blank_egg_prefix) && (
                                    <div className='flex items-center justify-center h-[63svh]'>
                                        <p className='text-neutral-300 '>Please select a egg first</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {!visible && (
                <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] mt-6 p-1 flex flex-row justify-between items-center'>
                    <div className='flex flex-row items-center gap-2 h-full'>
                        <HugeIconsAlert
                            fill='currentColor'
                            className='w-[40px] h-[40px] m-2 mr-0 text-brand hidden md:block'
                        />
                        <div className='flex flex-col pb-1  m-2'>
                            <h1 className='text-xl'>Danger Zone</h1>
                            <p className='text-sm text-neutral-300'>
                                During this process some files may be deleted or modified either make a backup before
                                hand or pick the option when prompted.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
