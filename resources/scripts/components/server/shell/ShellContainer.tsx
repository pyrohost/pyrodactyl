import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsEggs from '@/components/elements/hugeicons/Egg';

const SoftwareContainer = () => {
    const [disabledModalVisible, setDisabledModalVisible] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (disabledModalVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [disabledModalVisible]);

    return (
        <ServerContentBlock title='Software'>
            <Dialog.Confirm
                open={disabledModalVisible}
                title={'Feature Disabled'}
                confirm={'Okay'}
                onClose={() => setDisabledModalVisible(false)}
                onConfirmed={() => setDisabledModalVisible(false)}
            >
                This feature is currently disabled. Please check back later.
            </Dialog.Confirm>

            <MainPageHeader direction='column' title='Software'>
                <h2 className='text-sm'>
                    Welcome to the software management page. Here you can change the game or software that is running on
                    your server.
                </h2>
            </MainPageHeader>

            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08]'>
                <div className='w-full h-full'>
                    <div className='flex items-center justify-between pb-4 p-2'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsEggs fill='currentColor' />
                            <div className='flex flex-col'>
                                <h1 className='text-2xl'>Current Egg</h1>
                                <p className='text-neutral-300 text-sm'>Feature currently disabled</p>
                            </div>
                        </div>
                        <button
                            className='rounded-full border-[1px] border-[#ffffff12] px-4 py-2 text-sm font-bold shadow-md hover:border-[#ffffff22] hover:shadow-lg bg-gradient-to-b from-[#ffffff10] to-[#ffffff09] text-white'
                            onClick={() => {
                                setDisabledModalVisible(true);
                                toast.error('This feature is currently disabled.');
                            }}
                        >
                            Change Egg
                        </button>
                    </div>
                </div>
            </div>

            <div className='relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] mt-6 p-1 flex flex-row justify-between items-center'>
                <div className='flex flex-row items-center gap-2 h-full'>
                    <HugeIconsAlert
                        fill='currentColor'
                        className='w-[40px] h-[40px] m-2 mr-0 text-brand hidden md:block'
                    />
                    <div className='flex flex-col pb-1  m-2'>
                        <h1 className='text-xl'>Danger Zone</h1>
                        <p className='text-sm text-neutral-300'>
                            During this process some files may be deleted or modified either make a backup before hand
                            or pick the option when prompted.
                        </p>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
