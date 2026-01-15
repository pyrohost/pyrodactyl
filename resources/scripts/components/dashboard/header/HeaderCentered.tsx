import { cn } from '@/lib/utils';

const HeaderCentered = ({ children, className = '' }) => {
    return (
        <div className='xl:absolute xl:right-0 xl:translate-x-1/2 xl:left-0 xl:w-auto w-full'>
            <div
                className={cn(
                    'h-full w-full xl:w-fit xl:absolute xl:-translate-x-1/2 xl:-translate-y-1/2 xl:top-1/2 flex items-center',
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
};

export default HeaderCentered;
