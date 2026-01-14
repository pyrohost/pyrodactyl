import clsx from 'clsx';

import CopyOnClick from '@/components/elements/CopyOnClick';

import styles from './style.module.css';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    children: React.ReactNode;
    className?: string;
}

const StatBlock = ({ title, copyOnClick, className, children }: StatBlockProps) => {
    return (
        <CopyOnClick text={copyOnClick}>
            <div
                className={clsx(
                    'bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 group shadow-sm',
                    className,
                )}
            >
                <div className={'flex flex-col justify-center overflow-hidden w-full cursor-default'}>
                    <p className={'leading-tight text-xs text-zinc-400 mb-2 uppercase tracking-wide font-medium'}>
                        {title}
                    </p>
                    <div
                        className={
                            'text-lg sm:text-xl font-bold leading-tight tracking-tight w-full truncate text-zinc-100 group-hover:text-white transition-colors duration-150'
                        }
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};

export default StatBlock;
