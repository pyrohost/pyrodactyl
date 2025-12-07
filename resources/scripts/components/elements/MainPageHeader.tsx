import { JSX } from 'react';
import styled from 'styled-components';

import { cn } from '@/lib/utils';

const HeaderWrapper = styled.div``;

interface MainPageHeaderProps {
    children?: React.ReactNode;
    direction?: 'row' | 'column';
    titleChildren?: JSX.Element;
    title?: string;
    headChildren?: JSX.Element;
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({
    children,
    headChildren,
    titleChildren,
    title,
    direction = 'row',
}) => {
    return (
        <HeaderWrapper
            className={cn(
                'flex',
                direction === 'row' ? 'items-center flex-col md:flex-row' : 'items-start flex-col',
                'justify-between',
                'mb-8 gap-8 mt-8 md:mt-0 select-none',
            )}
        >
            <div className='flex items-center gap-4 flex-wrap'>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>{title}</h1>
                <div className=''>{headChildren}</div>
                {titleChildren}
            </div>
            {children}
        </HeaderWrapper>
    );
};
