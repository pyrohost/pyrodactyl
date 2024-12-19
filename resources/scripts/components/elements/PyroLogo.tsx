import anime from 'animejs';
import React, { useEffect, useRef } from 'react';

const Logo = () => {
    const logoRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        // Initial animation, I stole this from an old project of mine, Feel free to fine tune the animations
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
    }, []);

    const handleHover = (isEntering) => {
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
    };

    return (
        <div
            className='flex items-center cursor-pointer'
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            

            <span ref={textRef} className='ml-2 text-lg font-bold'>
                {import.meta.env.VITE_SITE_NAME}
            </span>
        </div>
    );
};

export default Logo;
