import clsx from 'clsx';

import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

// eslint-disable-next-line react/display-name
export default ({ title, legend, children }: ChartBlockProps) => (
    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 group h-full shadow-sm'>
        <div className={'flex items-center justify-between mb-3 sm:mb-4'}>
            <h3 className={'font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors duration-150'}>
                {title}
            </h3>
            {legend && <div className={'text-xs sm:text-sm flex items-center text-zinc-400'}>{legend}</div>}
        </div>
        <div className={'z-10 overflow-hidden rounded-lg h-40 sm:h-48'}>{children}</div>
    </div>
);
