import clsx from 'clsx';
import styled from 'styled-components';
import React, { useEffect, useRef } from 'react';

const HeaderWrapper = styled.div``;

interface MainPageHeaderProps {
    children?: React.ReactNode;
    direction?: 'row' | 'column';
    titleChildren?: JSX.Element;
    title?: string;
    animation?: 'flyside' | 'flyright' | 'pop' | 'none';
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({
    children,
    titleChildren,
    title,
    direction = 'row',
    animation = 'flyside', // Default animation
}) => {
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (titleRef.current && animation !== 'none') {
            // Dynamically import anime.js
            import('animejs').then((animeModule) => {
                const anime = animeModule.default || animeModule;
                
                // Define animation properties based on the animation type
                const animations = {
                    flyside: {
                        translateX: [-50, 0],
                        opacity: [0, 1],
                    },
                    flyright: {
                        translateX: [50, 0],
                        opacity: [0, 1],
                    },
                    pop: {
                        scale: [0.8, 1.05, 1],
                        opacity: [0, 1],
                    }
                };

                // Apply the animation
                anime({
                    targets: titleRef.current,
                    ...animations[animation],
                    duration: animation === 'pop' ? 600 : 800,
                    easing: animation === 'pop' ? 'spring(1, 80, 10, 0)' : 'easeOutQuad',
                    delay: 100
                });
            });
        }
    }, [animation, title]); // Re-run if title or animation changes

    return (
        <HeaderWrapper
            className={clsx(
                'flex',
                direction === 'row' ? 'items-center flex-col md:flex-row' : 'items-start flex-col',
                'justify-between',
                'mb-8 gap-8 mt-8 md:mt-0 select-none',
            )}
        >
            <div className='flex items-center gap-4 flex-wrap'>
                <h1 
                    ref={titleRef} 
                    className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] opacity-0'
                >
                    {title}
                </h1>
                {titleChildren}
            </div>
            {children}
        </HeaderWrapper>
    );
};