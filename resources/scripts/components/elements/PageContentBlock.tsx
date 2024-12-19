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
            document.title = title + ' | Astral';
        }
    }, [title]);

    return (
        <>
            <MainPage className={`${className || ''} `}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
                {children}
            </MainPage>
        </>
    );
};

export default PageContentBlock;
