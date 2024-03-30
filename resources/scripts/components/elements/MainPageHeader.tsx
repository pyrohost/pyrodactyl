import styled from 'styled-components';

const HeaderWrapper = styled.div``;

interface MainPageHeaderProps {
    children?: React.ReactNode;
    titleChildren?: JSX.Element;
    title?: string;
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({ children, titleChildren, title }) => {
    return (
        <HeaderWrapper className='flex flex-col md:flex-row justify-between items-center mb-8 gap-8 mt-8 md:mt-0'>
            <div className='flex items-center gap-4'>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>{title}</h1>
                {titleChildren}
            </div>
            {children}
        </HeaderWrapper>
    );
};
