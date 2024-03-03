// FIXME: add icons back
import * as React from 'react';
import clsx from 'clsx';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            className={clsx(
                'flex items-center border-l-8 text-zinc-50 rounded-md shadow px-4 py-3',
                {
                    ['border-red-500 bg-red-500/25']: type === 'danger',
                    ['border-yellow-500 bg-yellow-500/25']: type === 'warning',
                },
                className
            )}
        >
            {type === 'danger' ? (
                // <ShieldExclamationIcon className={'w-6 h-6 text-red-400 mr-2'} />
                <div>FIXME: ShieldExclamationIcon</div>
            ) : (
                // <ExclamationIcon className={'w-6 h-6 text-yellow-500 mr-2'} />
                <div>FIXME: ExclamationIcon</div>
            )}
            {children}
        </div>
    );
};
