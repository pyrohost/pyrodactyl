import { Actions, useStoreActions } from 'easy-peasy';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import FlashMessageRender from '@/components/FlashMessageRender';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsArrowRight from '@/components/elements/hugeicons/ArrowRight';

import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import reinstallServer from '@/api/server/reinstallServer';
import setSelectedEggImage from '@/api/server/setSelectedEggImage';
import getServerBackups from '@/api/swr/getServerBackups';
import createServerBackup from '@/api/server/backups/createServerBackup';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Egg {
    object: string;
    attributes: {
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
        slug: 'Backup',
        title: 'Do you want to make a backup?',
        description: 'This process may modify or delete some files.',
    },
    {
        slug: 'Nest',
        title: 'Select a Game/Sofware',
        description: 'Select your preferred game or software.',
    },
    {
        slug: 'Version',
        title: 'Version',
        description: 'Confirm your selection.',
    },
    {
        slug: 'Egg',
        title: 'Select the sub-set',
        description: 'Select the sub-set of the game or software.',
    },
]
const hidden_nests = ['Pyro']; // Hardcoded
const blankEggId = 'ab151eec-ab55-4de5-a162-e8ce854b3b60'; // Hardcoded change for prod

const ShellContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [nests, setNests] = useState<Nest | null>(null);
    const currentEgg = ServerContext.useStoreState((state) => state.server.data!.egg);
    const currentEggName = nests && nests.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg))?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg)?.attributes.name;
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);
    const { data: backups } = getServerBackups();

    const [step, setStep] = useState(steps[0] && currentEgg === blankEggId ? 1 : 0);
    const [modalVisible, setModalVisible] = useState(false);
    const [visible, setVisible] = useState(false);

    const [shouldBackup, setShouldBackup] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [showFullDescriptions, setShowFullDescriptions] = useState<boolean[]>([]);

    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (backups) {
            if (backupLimit <= 0 || backups.backupCount >= backupLimit) {
                setShouldBackup(false);
            }
        }
    }, [backups, backupLimit]);

    const reinstall = () => {
        clearFlashes('shell');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'shell',
                    type: 'success',
                    message: 'Your servers egg has changed and the reinstallation process has begun.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'shell', type: 'error', message: httpErrorToHuman(error) });
            })
    };

    const handleNestSelect = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
    };

    const changeEgg = (eggId: number, nestId: number) => {
        setSelectedEggImage(uuid, eggId, nestId)
        .then(() => {
            reinstall();
            setModalVisible(false);
        })
        .catch((error) => {
            console.error(error);
            addFlash({ key: 'shell', type: 'error', message: httpErrorToHuman(error) });
        });
    };

    const confirmSelection = () => {
        // get the index id because the model dosent use uuid
        const nestId = nests?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid))?.attributes.id;
        const eggId = nests?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid))?.attributes.relationships.eggs.data.findIndex((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid) + 1;
        
        if (shouldBackup) {
            createServerBackup(uuid, {name: `${selectedEgg?.attributes.name} Migration - ${new Date().toLocaleString()}`, isLocked: false})
                .then(() => {
                    changeEgg(eggId, nestId);
                })
                .catch((error) => {
                    toast.error(httpErrorToHuman(error));
                });
        } else if (shouldBackup === false) {
            changeEgg(eggId, nestId);
        }
        
    };

    const handleEggSelect = (egg: Egg) => {
        setSelectedEgg(egg);
        setModalVisible(true);
    };
    
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
                        <button onClick={() => toggleDescriptionVisibility(index)}>Show More</button>
                    </>
                ) : (
                    <>
                        {description}
                        {isLongDescription && (
                            <button onClick={() => toggleDescriptionVisibility(index)}>..Show Less</button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <ServerContentBlock title='Shell'>
            <FlashMessageRender byKey='Shell' />
            <MainPageHeader direction='column' title='Shell'>
                <h2 className='text-sm'>
                The shell is a powerful tool that allows you to edit your server egg.
                </h2>
            </MainPageHeader>

            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server reinstallation'}
                confirm={'Yes, reinstall server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={() => confirmSelection()}
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Dialog.Confirm>
            
            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08]'>
                <div className='w-full h-full'>
                    <div className='flex items-center justify-between pb-4 p-2'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsEggs fill='currentColor' />
                            <div className='flex flex-col'>
                                <h1 className='text-2xl'>Current Egg</h1>
                                {currentEggName}
                            </div>
                        </div>
                        {!visible && (
                            <button
                                style={{
                                    background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                }}
                                className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                                onClick={() => setVisible(true)}
                            >
                                Change Egg
                            </button>
                        )}
                    </div>
                    {visible && (
                    <div className='bg-[#0f0f0f] rounded-lg border-[1px] border-[#ffffff07]'>
                        <div className='flex items-center justify-between bg-[#1d1d1d] mb-2'>
                            {steps[step] && (
                            <div className='p-1 pl-4'>
                                <h1 className='text-xl'>{steps[step].title} <span className='p-2 text-neutral-600'>•</span> <span className='text-neutral-400 text-sm'>{steps[step].description}</span></h1>
                            </div>
                            )}
                            <div className='flex items-center gap-2 p-4 pr-5'>
                                {steps.map((cstep, index) => index <= 0 && currentEgg === blankEggId ? null : (
                                    <div key={cstep.slug} className='flex items-center gap-2' onClick={() => setStep(index)} style={{ cursor: 'pointer' }}>
                                        <h2 className={`text-lg1 ${index === step ? 'text-brand font-bold' : 'text-neutral-300'}`}>{cstep.slug}</h2>
                                        {index < steps.length - 1 && <span className='text-neutral-300'><HugeIconsArrowRight fill='currentColor' className='text-neutral-600' /></span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='p-4'>
                            {step == 0 && currentEgg !== blankEggId && (
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center justify-between gap-2'>
                                        <label className='autoSaverSwitch relative inline-flex cursor-pointer select-none items-center'>
                                            <input
                                                type='checkbox'
                                                name='backup'
                                                className='sr-only'
                                                checked={shouldBackup}
                                                onChange={() => setShouldBackup(!shouldBackup)}
                                            />
                                            <span
                                                className={`slider mr-3 flex h-[26px] w-[50px] items-center rounded-full p-1 duration-200 ${
                                                    shouldBackup ? 'bg-brand' : 'bg-[#252525]'
                                                }`}
                                            >
                                            <span
                                                className={`dot h-[18px] w-[18px] rounded-full bg-white duration-200 ${
                                                    shouldBackup ? 'translate-x-6' : ''
                                                }`}
                                            ></span>
                                            </span>
                                        </label>
                                        <label htmlFor='backup' className='text-neutral-300'>Create a backup before changing the egg</label>
                                    </div>
                                </div>
                            )}
                            {step == 1 && (
                            <div>
                                <div className='grid grid-cols-3 gap-4 mt-4'>
                                    {nests?.map((nest) => hidden_nests.includes(nest.attributes.name) ? null : (
                                        <button
                                            key={nest.attributes.uuid}
                                            onClick={() => handleNestSelect(nest)}
                                            className={`cursor-pointer border border-neutral-500 hover:border-neutral-400 p-4 rounded-lg w-full ${
                                                selectedNest?.attributes.uuid === nest.attributes.uuid ? 'bg-[#1a1a1a]' : 'bg-[#0f0f0f]'
                                            }`}
                                        >
                                            <p className='text-neutral-300 text-sm'>{nest.attributes.name}</p>
                                            <p className='text-neutral-300 text-xs mt-2'>{nest.attributes.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            )}
                            {step == 2 && (
                                <div>
                                    soon:tm:
                                </div>
                            )}
                            {step == 3 && selectedNest && (
                                <div>
                                    <div className='grid grid-cols-3 gap-4 mt-4'>
                                        {selectedNest.attributes.relationships.eggs.data.map((egg, eggIndex) => currentEgg === egg.attributes.uuid ? null :(
                                            <div
                                                key={egg.attributes.uuid}
                                                className='cursor-pointer border border-neutral-500 hover:border-neutral-400 p-4 rounded-lg bg-[#0f0f0f] w-full'
                                            >
                                                <p className='text-neutral-300 text-md'>{egg.attributes.name}</p>
                                                <p className='text-neutral-300 text-xs mt-2'>{renderEggDescription(egg.attributes.description, eggIndex)}</p>
                                                <div className='flex justify-end '>
                                                <button
                                                    style={{
                                                        background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                                    }}
                                                    className='rounded-full border-[1px] border-[#ffffff12] px-3 py-1 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg mt-2'
                                                    onClick={() => handleEggSelect(egg)}
                                                >
                                                    Select
                                                </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) || step == 3 && (
                                <div className='flex items-center justify-center'>
                                    <p className='text-neutral-300'>Select a category to choose a game from.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>

            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] mt-6 p-1 flex flex-row justify-between items-center'>
                <div className='flex flex-row items-center gap-2'>
                    <HugeIconsAlert fill='currentColor' className='pl-1 text-brand' />
                    <div className='flex flex-col pb-1'>
                        <h1 className='text-xl'>Danger Zone</h1>
                        <p className='text-sm text-neutral-300'>During this process some files may be deleted or modified either make a backup before hand or pick the option when prompted.</p>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default ShellContainer;