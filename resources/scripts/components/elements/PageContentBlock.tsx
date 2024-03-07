import { useEffect } from 'react';
import MainPage from '@/components/elements/MainPage';
import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title + ' | pyro.host';
        }
    }, [title]);

    return (
        <>
            <MainPage className={`${className && ''} px-2 sm:px-14 py-2 sm:py-14`}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
                {children}
            </MainPage>
        </>
    );
};

export default PageContentBlock;
