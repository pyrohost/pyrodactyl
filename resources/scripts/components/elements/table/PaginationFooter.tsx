import clsx from 'clsx';

import ActionButton from '@/components/elements/ActionButton';
import HugeIconsChevronLeft from '@/components/elements/hugeicons/ChevronLeft';
import HugeIconsChevronRight from '@/components/elements/hugeicons/ChevronRight';

import { PaginationDataSet } from '@/api/http';

interface Props {
    className?: string;
    pagination: PaginationDataSet;
    onPageSelect: (page: number) => void;
}

const PaginationFooter = ({ pagination, className, onPageSelect }: Props) => {
    const start = (pagination.currentPage - 1) * pagination.perPage;
    const end = (pagination.currentPage - 1) * pagination.perPage + pagination.count;

    const { currentPage: current, totalPages: total } = pagination;

    const pages = { previous: [] as number[], next: [] as number[] };
    for (let i = 1; i <= 2; i++) {
        if (current - i >= 1) {
            pages.previous.push(current - i);
        }
        if (current + i <= total) {
            pages.next.push(current + i);
        }
    }

    if (pagination.total === 0) {
        return null;
    }

    return (
        <div className={clsx('flex items-center justify-between my-2', className)}>
            <p className={'text-sm text-zinc-500'}>
                Showing&nbsp;
                <span className={'font-semibold text-zinc-400'}>{Math.max(start, Math.min(pagination.total, 1))}</span>
                &nbsp;to&nbsp;
                <span className={'font-semibold text-zinc-400'}>{end}</span> of&nbsp;
                <span className={'font-semibold text-zinc-400'}>{pagination.total}</span> results.
            </p>
            {pagination.totalPages > 1 && (
                <div className={'flex space-x-1'}>
                    <ActionButton
                        variant='secondary'
                        size='sm'
                        onClick={() => onPageSelect(current - 1)}
                        disabled={current <= 1}
                        className='w-8 h-8 p-0 flex items-center justify-center'
                    >
                        <HugeIconsChevronLeft fill='currentColor' className='w-3 h-3' />
                    </ActionButton>
                    {pages.previous.reverse().map((value) => (
                        <ActionButton
                            key={`previous-${value}`}
                            variant='secondary'
                            size='sm'
                            onClick={() => onPageSelect(value)}
                            className='w-8 h-8 p-0 flex items-center justify-center'
                        >
                            {value}
                        </ActionButton>
                    ))}
                    <ActionButton
                        variant='primary'
                        size='sm'
                        className='w-8 h-8 p-0 flex items-center justify-center'
                        disabled
                    >
                        {current}
                    </ActionButton>
                    {pages.next.map((value) => (
                        <ActionButton
                            key={`next-${value}`}
                            variant='secondary'
                            size='sm'
                            onClick={() => onPageSelect(value)}
                            className='w-8 h-8 p-0 flex items-center justify-center'
                        >
                            {value}
                        </ActionButton>
                    ))}
                    <ActionButton
                        variant='secondary'
                        size='sm'
                        onClick={() => onPageSelect(current + 1)}
                        disabled={current >= total}
                        className='w-8 h-8 p-0 flex items-center justify-center'
                    >
                        <HugeIconsChevronRight fill='currentColor' className='w-3 h-3' />
                    </ActionButton>
                </div>
            )}
        </div>
    );
};

export default PaginationFooter;
