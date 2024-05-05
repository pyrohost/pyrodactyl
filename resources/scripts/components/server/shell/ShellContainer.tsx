import { useState, useEffect } from 'react';
import FlashMessageRender from '@/components/FlashMessageRender';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';

import { ServerContext } from '@/state/server';

import getNests from '@/api/nests/getNests';
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

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [visible, setVisible] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const currentEgg = ServerContext.useStoreState((state) => state.server.data!.egg); // current egg ID
    const [nests, setNests] = useState<Nest[]>([]);

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

    const handleEggSelect = (egg: Egg) => {
        setSelectedEggImage(uuid, egg.attributes.uuid);
        setSelectedEgg(egg);
    };

    const currentEggName = nests && nests.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg))?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === currentEgg)?.attributes.name;

    return (
        <ServerContentBlock title='Shell'>
            <FlashMessageRender byKey='Shell' />
            <MainPageHeader direction='column' title='Shell'>
                <h2 className='text-sm'>
                The shell is a powerful tool that allows you to edit your server egg.
                </h2>
            </MainPageHeader>
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
                        {!selectedNest && (
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
                                {nests.map((nest) => (
                                    <div
                                        key={nest.attributes.uuid}
                                        onClick={() => handleNestSelect(nest)}
                                        className='cursor-pointer border border-neutral-500 hover:border-neutral-400 p-4 rounded-lg bg-neutral-950'
                                    >
                                        <p className='text-neutral-300 text-sm'>{nest.attributes.name}</p>
                                        <p className='text-neutral-300 text-xs mt-2'>{nest.attributes.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}
                        {selectedNest && !selectedEgg && (
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
                                <ul>
                                    {selectedNest.attributes.relationships.eggs.data.map((egg) => (
                                        <li key={egg.attributes.uuid}>
                                            <button onClick={() => handleEggSelect(egg)}>{egg.attributes.name}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {selectedEgg && (
                            <div>
                                <h2 className='text-lg mt-8'>Selected Egg</h2>
                                <div className='flex items-center justify-between mt-2 text-sm'>
                                    <p>Egg ID</p>
                                    <code className='font-mono bg-zinc-900 rounded py-1 px-2'>{selectedEgg.attributes.uuid}</code>
                                </div>
                            </div>
                        )}
                    </TitledGreyBox>
                    )}
                </div>
            </div>

            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] mt-6 p-1 flex flex-row justify-between items-center'>
                <div className='flex flex-row items-center gap-2'>
                    <HugeIconsAlert fill='currentColor' className='pl-1 text-red-500/80' />
                    <div className='flex flex-col'>
                        <h1 className='text-xl'>Danger Zone</h1>
                        <p className='text-sm text-neutral-300'>Reinstall Server will delete all data on your server. Please make sure to backup your data before reinstalling.</p>
                    </div>
                </div>
                
                <button
                    style={{
                        background:
                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                    }}
                    className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg'
                    // confirm reinstall server
                >
                    Reinstall Server
                </button>
            </div>


        </ServerContentBlock>
    );
};