import React from 'react';
import clsx from 'clsx';
import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, legend, children }: ChartBlockProps) => (
    <div className={clsx(styles.chart_container, 'group !p-8')}>
        <div className={'flex items-center justify-between mb-4'}>
            <h3 className={'font-extrabold text-sm'}>{title}</h3>
            {legend && <p className={'text-sm flex items-center'}>{legend}</p>}
        </div>
        <div className={'z-10 overflow-hidden rounded-lg'}>{children}</div>
    </div>
);
