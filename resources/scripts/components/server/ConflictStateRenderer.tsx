import anime from 'animejs/lib/anime.es.js';
import { Cog, Database, Server } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import ScreenBlock from '@/components/elements/ScreenBlock';

import { ServerContext } from '@/state/server';

const ReconstructingServer = () => {
    const animationRef = useRef(null);

    useEffect(() => {
        animationRef.current = anime.timeline({
            loop: true,
            direction: 'alternate',
            easing: 'easeInOutSine',
        });

        animationRef.current
            .add({
                targets: '#server',
                translateY: -15,
                rotate: 5,
                duration: 2000,
            })
            .add(
                {
                    targets: '#cog',
                    rotate: 360,
                    duration: 3000,
                },
                '-=2000',
            )
            .add(
                {
                    targets: '#database',
                    scale: 1.1,
                    duration: 1500,
                },
                '-=3000',
            )
            .add(
                {
                    targets: '.reconstruction-beam',
                    height: '100%',
                    opacity: 0.7,
                    duration: 2000,
                },
                '-=2000',
            );

        return () => {
            if (animationRef.current) animationRef.current.pause();
        };
    }, []);

    return (
        <div className='flex flex-col items-center justify-center h-full bg-gray-900 text-white'>
            <div className='relative w-64 h-64'>
                <Server
                    id='server'
                    className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400'
                    size={64}
                />
                <Cog id='cog' className='absolute top-1/4 right-1/4 text-green-400' size={32} />
                <Database id='database' className='absolute bottom-1/4 left-1/4 text-yellow-400' size={32} />
                <svg
                    className='absolute top-0 left-1/2 transform -translate-x-1/2'
                    width='2'
                    height='100%'
                    viewBox='0 0 2 100'
                >
                    <rect className='reconstruction-beam' width='2' height='0' fill='rgba(59, 130, 246, 0.5)' />
                </svg>
            </div>
            <h2 className='text-2xl font-bold mt-8 mb-2'>Reconstructing Server</h2>
            <p className='text-gray-400 text-center max-w-md'>
                Your server is being optimized and reconstructed. This process enhances performance and security. Please
                wait a moment.
            </p>
        </div>
    );
};

const ConflictStateRenderer = () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false,
    );

    if (status === 'installing' || status === 'install_failed' || status === 'reinstall_failed') {
        return <ReconstructingServer />;
    }

    if (status === 'suspended') {
        return <ScreenBlock title={'Server Suspended'} message={'This server is suspended and cannot be accessed.'} />;
    }

    if (isNodeUnderMaintenance) {
        return (
            <ScreenBlock
                title={'Node under Maintenance'}
                message={'The node of this server is currently under maintenance.'}
            />
        );
    }

    return (
        <ScreenBlock
            title={isTransferring ? 'Transferring' : 'Restoring from Backup'}
            message={
                isTransferring
                    ? 'Your server is being transferred to a new node, please check back later.'
                    : 'Your server is currently being restored from a backup, please check back in a few minutes.'
            }
        />
    );
};

export default ConflictStateRenderer;
