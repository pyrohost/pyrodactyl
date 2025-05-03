import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import FlashMessageRender from '@/components/FlashMessageRender';
import MainPage from '@/components/elements/MainPage';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
    children?: React.ReactNode;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (title) {
            document.title = title + t('server_titles.site_name_suffix');
        }
    }, [title, t]);

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
