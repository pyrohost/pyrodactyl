import { useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title: string;
    className?: string;
    showFlashKey?: string;
    background?: boolean;
    children?: React.ReactNode;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({
    title,
    showFlashKey,
    className,
    children,
    background = true,
}) => {
    useEffect(() => {
        if (title) {
            document.title = title + ' | Pyrodactyl';
        }
    }, [title]);

    return (
        <>
            <div
                className={`${className || ''} max-w-[120rem] overflow-y-auto w-full mx-auto flex flex-col flex-1 h-full relative rounded-2xl ${background ? 'bg-bg-raised border border-mocha-400 p-7' : ''}`}
            >
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
                {children}
            </div>
        </>
    );
};

export default PageContentBlock;
