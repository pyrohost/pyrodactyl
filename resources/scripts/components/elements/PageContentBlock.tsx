import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import tw from 'twin.macro';
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
            <ContentContainer className={`${className && ''} py-2 sm:py-14`}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                {children}
            </ContentContainer>
        </>
    );
};

export default PageContentBlock;
