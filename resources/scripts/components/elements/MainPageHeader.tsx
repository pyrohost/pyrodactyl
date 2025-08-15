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
        <HeaderWrapper className={clsx('flex flex-col', 'mb-4 gap-8 mt-8 md:mt-0 select-none')}>
            <div
                className={clsx(
                    'flex items-center',
                    direction === 'row' ? 'flex-col md:flex-row' : 'flex-row',
                    'justify-between',
                    'gap-4',
                )}
            >
                <div className='flex items-center gap-4 flex-wrap'>
                    <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>{title}</h1>
                </div>
                {titleChildren}
            </div>
            {direction === 'column' && children && <div className='-mt-4'>{children}</div>}
        </HeaderWrapper>
    );
};
