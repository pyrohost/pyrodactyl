import anime from 'animejs';
import React, { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

interface PageProps {
    AppConfig: {
        appName: string;
    };
}

const LogoLogin: React.FC = () => {
    const logoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const { AppConfig } = usePage().props as PageProps;

    useEffect(() => {
        if (!logoRef.current || !textRef.current) return;

        const timeline = anime.timeline({
            easing: 'easeOutExpo',
        });

        timeline
            .add({
                targets: logoRef.current,
                scale: [0, 1],
                rotate: ['20deg', '0deg'],
                duration: 1000,
            })
            .add({
                targets: textRef.current,
                translateX: [-20, 0],
                opacity: [0, 1],
                duration: 800,
            }, '-=400');

        return () => timeline.pause();
    }, []);

    const handleHover = (isEntering: boolean) => {
        if (!logoRef.current || !textRef.current) return;

        anime({
            targets: logoRef.current,
            scale: isEntering ? 1.1 : 1,
            rotate: isEntering ? ['0deg', '5deg'] : ['5deg', '0deg'],
            duration: 300,
            easing: 'easeOutQuad',
        });

        anime({
            targets: textRef.current,
            translateY: isEntering ? -2 : 0,
            duration: 300,
            easing: 'easeOutQuad',
        });
    };

    return (
        <div
            className="flex items-center cursor-pointer justify-center select-none mb-2"
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            <div ref={logoRef} className="flex items-center justify-center">
            <img 
        src={AppConfig.appLogo} // Fix syntax with curly braces
        alt="Logo" 
        className="h-36 w-36 lg:h-36 lg:w-36 shrink-0"
    />
            </div>
            <span 
                ref={textRef} 
                className="ml-3 text-2xl lg:text-2xl font-bold text-white tracking-tight"
            >
                {AppConfig.appName || 'Pterodactyl'}
            </span>
        </div>
    );
};

export default LogoLogin;