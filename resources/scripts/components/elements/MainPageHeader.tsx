import clsx from 'clsx';
import { JSX } from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.div``;

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
    return (
        <HeaderWrapper className={clsx('flex flex-col', 'mb-4 gap-4 md:gap-8 mt-8 md:mt-0 select-none')}>
            <div
                className={clsx(
                    'flex',
                    direction === 'row'
                        ? 'flex-col sm:flex-row sm:items-center'
                        : 'flex-col sm:flex-row sm:items-start',
                    'justify-between',
                    'gap-4',
                )}
            >
                <div className='flex items-center gap-4 flex-wrap min-w-0 flex-1'>
                    <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-[52px] font-extrabold leading-[98%] tracking-[-0.02em] sm:tracking-[-0.06em] md:tracking-[-0.14rem] break-words'>
                        {title}
                    </h1>
                </div>
                {titleChildren && <div className='flex-shrink-0 w-full sm:w-auto'>{titleChildren}</div>}
            </div>
            {direction === 'column' && children && <div className='-mt-2 md:-mt-4'>{children}</div>}
        </HeaderWrapper>
    );
};
