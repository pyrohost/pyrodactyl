import { Actions, useStoreActions } from 'easy-peasy';
import { useState, useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import { Dialog } from '@/components/elements/dialog';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import reinstallServer from '@/api/server/reinstallServer';
import setSelectedEggImage from '@/api/server/setSelectedEggImage';

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

const ShellContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [shouldBackup, setShouldBackup] = useState<boolean | null>(null);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const currentEgg = ServerContext.useStoreState((state) => state.server.data!.egg);
    const [nests, setNests] = useState<Nest | null>(null);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

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
    }

    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };

        fetchData();
    }, []);

    const handleNestSelect = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
    };

    const confirmSelection = () => {
        // get the index id because the model dosent use uuid
        const nestId = nests?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid))?.attributes.id;
        const eggId = nests?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid))?.attributes.relationships.eggs.data.findIndex((egg) => egg.attributes.uuid === selectedEgg?.attributes.uuid) + 1;
        
        setSelectedEggImage(uuid, eggId, nestId);
        reinstall();
        setModalVisible(false);
    };

    const handleEggSelect = (egg: Egg) => {
        setSelectedEgg(egg);
        setModalVisible(true);
    };

    const currentEggName = nests && nests.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg))?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg)?.attributes.name;

    console.log(nests);
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
            
            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] p-2'>
                <div className='w-full h-full'>
                    <div className='flex items-center justify-between pb-4'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsEggs fill='currentColor' />
                            <div className='flex flex-col'>
                                <h1 className='text-2xl'>Current Egg</h1>
                                {currentEggName}
                            </div>
                        </div>
                        <button
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                            }}
                            className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                            onClick={() => setVisible(true)}
                        >
                            Change Egg
                        </button>
                    </div>
                    {visible && (
                    <TitledGreyBox title='Setup'>
                        {!selectedNest && shouldBackup == null && (
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h2 className='text-lg1'>Do you want to make a backup?</h2>
                                    <p className='text-neutral-300 text-sm'>This process may modify or delete some files.</p>
                                </div>
                                <div className='flex items-center justify-between gap-2'>
                                    <button
                                        style={{
                                            background:
                                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                        }}
                                        className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                                        onClick={() => setShouldBackup(true)}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        style={{
                                            background:
                                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                        }}
                                        className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                                        onClick={() => setShouldBackup(false)}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        )}
                        {!selectedNest && shouldBackup !== null && (
                        <div>
                            <div className='flex items-center justify-between pb-4'>
                                <h2 className='text-lg mt-8'>Select a Server Category</h2>
                                <button
                                    style={{
                                        background:
                                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                    }}
                                    className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                                    onClick={() => setVisible(false)}
                                >
                                    Back
                                </button>
                            </div>
                            <div className='grid grid-cols-3 gap-4 mt-4'>
                                {nests?.map((nest) => (
                                    <button
                                        key={nest.attributes.uuid}
                                        onClick={() => handleNestSelect(nest)}
                                        className='cursor-pointer border border-neutral-500 hover:border-neutral-400 p-4 rounded-lg bg-neutral-950'
                                    >
                                        <p className='text-neutral-300 text-sm'>{nest.attributes.name}</p>
                                        <p className='text-neutral-300 text-xs mt-2'>{nest.attributes.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        )}
                        {selectedNest && (
                            <div>
                                <div className='flex items-center justify-between pb-4'>
                                    <h2 className='text-lg mt-8'>Select an Game</h2>
                                    <button
                                        style={{
                                            background:
                                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                        }}
                                        className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                                        onClick={() => setSelectedNest(null)}
                                    >
                                        Back
                                    </button>
                                </div>
                                <div className='grid grid-cols-3 gap-4 mt-4'>
                                    {selectedNest.attributes.relationships.eggs.data.map((egg) => (
                                        <button
                                            key={egg.attributes.uuid}
                                            onClick={() => handleEggSelect(egg)}
                                            className='cursor-pointer border border-neutral-500 hover:border-neutral-400 p-4 rounded-lg bg-neutral-950 w-full'
                                        >
                                            <p className='text-neutral-300 text-sm'>{egg.attributes.name}</p>
                                            <p className='text-neutral-300 text-xs mt-2'>{egg.attributes.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TitledGreyBox>
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