import { DiscordLogoIcon } from '@radix-ui/react-icons';
import anime from 'animejs';
import clsx from 'clsx';
import { CheckCircle, LucideCircleAlert, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { ServerContext } from '@/state/server';

export const StatusPill = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const activeStates = ['starting', 'running', 'stopping'];
    const isInactive = !activeStates.includes(status);
    const [showModal, setShowModal] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        if (status !== 'starting' && isInactive) {
            setShowModal(true);
        }
    }, [status, isInactive]);

    useEffect(() => {
        if (showModal && modalRef.current) {
            anime({
                targets: modalRef.current,
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 300,
                easing: 'easeOutCubic',
            });
        }
    }, [showModal]);

    const closeModal = () => {
        anime({
            targets: modalRef.current,
            opacity: 0,
            scale: 0.9,
            duration: 300,
            easing: 'easeInCubic',
            complete: () => setShowModal(false),
        });
    };

    return (
        <>
            <div
                className={clsx(
                    'relative transition rounded-full pl-3 pr-3 py-2 flex items-center gap-1',
                    status === 'offline'
                        ? 'bg-red-400/25'
                        : status === 'running'
                          ? 'bg-green-400/25'
                          : 'bg-yellow-400/25',
                )}
            >
                <div
                    className={clsx(
                        'transition rounded-full h-4 w-4',
                        status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                    )}
                ></div>
                <div
                    className={clsx(
                        'transition rounded-full h-4 w-4 animate-ping absolute top-2.5 opacity-45',
                        status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                    )}
                ></div>
                <div className='text-sm font-bold'>
                    {status === 'offline'
                        ? 'Offline'
                        : status === 'running'
                          ? 'Online'
                          : status === 'stopping'
                            ? 'Stopping'
                            : status === 'starting'
                              ? 'Starting'
                              : 'Fetching'}
                </div>
            </div>

            {showModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div
                        ref={modalRef}
                        className='bg-zinc-900 p-6 rounded-lg shadow-xl flex flex-col items-center relative'
                    >
                        <button
                            onClick={closeModal}
                            className='absolute top-2 right-2 text-zinc-400 hover:text-white transition-colors duration-200'
                        >
                            <X className='w-6 h-6' />
                        </button>
                        <LucideCircleAlert className='w-12 h-12 text-zinc-400 mb-4' />
                        <p className='text-lg font-semibold text-white'>Sanity Check</p>
                        <p className='text-sm font-bold text-zinc-500'>
                            We have detected Some issues. Are these affecting your server?
                        </p>
                        <div className='flex flex-col gap-4 mt-4'>
                            <button
                                className='flex items-center justify-center bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-stone-700 transition duration-200 transform hover:scale-105 ease-in-out '
                                onClick={() => window.open('https://discord.gg/GYe6wzKrxc', '_blank')}
                            >
                                <DiscordLogoIcon className='w-5 h-5 mr-2' />
                                Report Problem
                            </button>
                            <button
                                className='flex items-center justify-center bg-red-900 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-700 transition duration-200 transform hover:scale-105 ease-in-out'
                                onClick={() => window.open('https://hetrix.astralaxis.tech/', '_blank')}
                            >
                                <CheckCircle className='w-5 h-5 mr-2' />
                                Check Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
