import React, { useEffect, useRef } from 'react';

const Logo = () => {
    const logoRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        // Import anime.js correctly for TypeScript
        import('animejs').then((animeModule) => {
            const anime = animeModule.default || animeModule;
            
            // Initial animation when component mounts
            anime
                .timeline({
                    easing: 'easeOutExpo',
                })
                .add({
                    targets: logoRef.current,
                    scale: [0, 1],
                    rotate: ['20deg', '0deg'],
                    duration: 1000,
                })
                .add(
                    {
                        targets: textRef.current,
                        translateX: [-20, 0],
                        opacity: [0, 1],
                        duration: 800,
                    },
                    '-=400',
                );
        });
    }, []);

    const handleHover = (isEntering) => {
        // Import anime.js correctly for TypeScript
        import('animejs').then((animeModule) => {
            const anime = animeModule.default || animeModule;
            
            anime({
                targets: logoRef.current,
                scale: isEntering ? 1.1 : 1,
                rotate: isEntering ? ['0deg', '10deg'] : ['10deg', '0deg'],
                duration: 300,
                easing: 'easeOutQuad',
            });

            anime({
                targets: textRef.current,
                translateY: isEntering ? -3 : 0,
                duration: 300,
                easing: 'easeOutQuad',
            });
        });
    };

    return (
        <div
            className='flex items-center cursor-pointer'
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            <div ref={logoRef} className="w-8 h-8">
                <img 
                    src="https://i.ibb.co/C5h9TGSH/Planet-4.png" 
                    alt="Pyrodactyl Logo" 
                    className="w-full h-full object-contain"
                />
            </div>

            <span ref={textRef} className='ml-2 text-lg font-bold'>
                Rydactyl
            </span>
        </div>
    );
};

export default Logo;