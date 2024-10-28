import anime from 'animejs/lib/anime.es.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.div`
    overflow: hidden; // To ensure the sliding animation doesn't cause scrollbars
`;

interface MainPageHeaderProps {
    children?: React.ReactNode;
    direction?: 'row' | 'column';
    titleChildren?: JSX.Element;
    title?: string;
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({
    children,
    titleChildren,
    title,
    direction = 'row',
}) => {
    const titleRef = useRef(null);

    useEffect(() => {
        // Title animation: slide from left
        anime({
            targets: titleRef.current,
            translateX: [-100, 0],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutExpo',
        });
    }, []);

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
                <h1 ref={titleRef} className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] opacity-0'>
                    {title}
                </h1>
                {titleChildren}
            </div>
            {children}
        </HeaderWrapper>
    );
};

export default MainPageHeader;
