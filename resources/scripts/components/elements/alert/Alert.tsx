import clsx from 'clsx';

import HugeIconsAlert from '../hugeicons/Alert';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            className={clsx(
                'flex items-center border-l-8 text-zinc-50 rounded-md shadow-sm px-4 py-3',
                {
                    ['border-red-500 bg-red-500/25']: type === 'danger',
                    ['border-yellow-500 bg-yellow-500/25']: type === 'warning',
                },
                className,
            )}
        >
            {type === 'danger' ? (
                <HugeIconsAlert fill='currentColor' className={'w-6 h-6 text-red-400 mr-2'} />
            ) : (
                // <HugeIconsAlert fill='currentColor'></HugeIconsAlert>
                <HugeIconsAlert fill='currentColor' className='pl-2 mr-3 text-yellow-500' />
            )}
            {children}
        </div>
    );
};
