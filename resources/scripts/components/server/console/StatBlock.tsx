import React from 'react';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import styles from './style.module.css';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    // const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={clsx(styles.stat_block, 'bg-[#ffffff09] border-[1px] border-[#ffffff11]', className)}>
                <div className={clsx(styles.status_bar, color || 'bg-zinc-700')} />
                {/* <div className={clsx(styles.icon, color || 'bg-zinc-700')}>
                    <Icon
                        icon={icon}
                        className={clsx({
                            'text-zinc-100': !color || color === 'bg-zinc-700',
                            'text-zinc-50': color && color !== 'bg-zinc-700',
                        })}
                    />
                </div> */}
                <div className={'flex flex-col justify-center overflow-hidden w-full'}>
                    <p className={'leading-tight text-xs md:text-sm text-zinc-400'}>{title}</p>
                    <div className={'text-[32px] font-extrabold leading-[98%] tracking-[-0.07rem] w-full truncate'}>
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
