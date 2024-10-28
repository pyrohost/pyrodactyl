// million-ignore
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import anime from 'animejs/lib/anime.es.js';
import { ArrowBigRight, DollarSign, ServerCrash } from 'lucide-react';
import { AlertOctagon, Server, Wifi } from 'lucide-react';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const ScreenBlock = ({ title, message }) => {
    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                    <p className=''>{message}</p>
                </div>
            </div>
        </>
    );
};

const ServerError = ({ title, message }) => {
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
                    targets: '#alert',
                    scale: 1.1,
                    duration: 1000,
                },
                '-=1000',
            )
            .add(
                {
                    targets: '.signal',
                    opacity: [0, 1],
                    translateX: ['-50%', '0%'],
                    delay: anime.stagger(200),
                    duration: 1000,
                },
                '-=2000',
            );

        return () => {
            if (animationRef.current) animationRef.current.pause();
        };
    }, []);

    return (
        <div className='w-full h-full flex items-center justify-center p-8 bg-black'>
            <div className='max-w-3xl w-full bg-zinc-900 rounded-lg shadow-lg overflow-hidden'>
                <div className='p-8 flex gap-12 items-center'>
                    <div className='relative flex-shrink-0'>
                        <Server id='server' className='text-red-500' size={64} />
                        <AlertOctagon id='alert' className='text-yellow-500 absolute -top-2 -right-2' size={24} />
                        <div className='absolute -left-4 top-1/2 -translate-y-1/2 space-y-1'>
                            <div className='signal w-3 h-1 bg-red-500 rounded-full opacity-0'></div>
                            <div className='signal w-3 h-1 bg-red-500 rounded-full opacity-0'></div>
                            <div className='signal w-3 h-1 bg-red-500 rounded-full opacity-0'></div>
                        </div>
                    </div>
                    <div className='flex flex-col gap-4 text-left'>
                        <h1 className='text-3xl font-extrabold leading-tight tracking-tight text-white'>{title}</h1>
                        <p className='text-gray-300'>{message}</p>
                        <div className='flex items-center text-yellow-500 mt-2'>
                            <Wifi size={18} className='mr-2' />
                            <span className='text-sm'>Connection interrupted</span>
                        </div>
                    </div>
                </div>
                <div className='bg-zinc-800 p-4 text-center'>
                    <p className='text-zinc-200 text-sm'>
                        Please try again later or contact support if the issue persists.
                    </p>
                </div>
            </div>
        </div>
    );
};

const NotFound = () => {
    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>Page Not Found</h1>
                    <p className=''>
                        We couldn&apos;t find the page you&apos;re looking for. You may have lost access, or the page
                        may have been removed. Here are some helpful links instead:
                    </p>
                    <div className='flex items-center space-x-4'>
                        <button
                            className='flex items-center justify-start bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-stone-700 transition duration-200 transform hover:scale-105 ease-in-out'
                            onClick={() => window.open('https://discord.gg/GYe6wzKrxc', '_blank')}
                        >
                            <DiscordLogoIcon className='w-5 h-5 mr-2 ' />
                            Contact Discord
                        </button>
                        <button
                            className='flex items-center justify-center bg-red-900 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-700 transition duration-200 transform hover:scale-105 ease-in-out'
                            onClick={() => (window.location.href = '/')}
                        >
                            <ServerCrash className='w-5 h-5 mr-2' />
                            Your Servers
                        </button>
                    </div>
                    <div className='flex flex-col gap-2'></div>
                </div>
                <img
                    alt=''
                    className='w-64 rounded-2xl'
                    height='256'
                    src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif'
                    width='256'
                    loading='lazy'
                    decoding='async'
                />
            </div>
        </>
    );
};

export { ServerError, NotFound };
export default ScreenBlock;

//SERVERS MEANT TO FIX ASAP KUSHIFIXO
