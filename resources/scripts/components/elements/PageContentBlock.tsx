import { useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import MainPage from '@/components/elements/MainPage';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
    children?: React.ReactNode;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title + ' | pyro.host';
        }
    }, [title]);

    return (
        <>
            <MainPage className={`${className || ''} max-w-[120rem] w-full mx-auto px-2 sm:px-14 py-2 sm:py-14`}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
                {children}
            </MainPage>
        </>
    );
};

export default PageContentBlock;
