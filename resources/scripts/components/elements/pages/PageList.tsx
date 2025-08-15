import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const PageListContainer = ({ className, children }: Props) => {
    return (
        <div
            style={{
                background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
            }}
            className={clsx(className, 'p-1 border-[1px] border-[#ffffff12] rounded-xl')}
        >
            <div className='flex h-full w-full flex-col gap-1 overflow-hidden rounded-lg'>{children}</div>
        </div>
    );
};
PageListContainer.displayName = 'PageListContainer';

const PageListItem = ({ className, children }: Props) => {
    return (
        <div
            className={clsx(
                className,
                'bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff15] p-4 sm:p-5 rounded-xl hover:border-[#ffffff20] transition-all flex items-center gap-4 flex-col sm:flex-row',
            )}
        >
            {children}
        </div>
    );
};
PageListItem.displayName = 'PageListItem';

export { PageListContainer, PageListItem };
