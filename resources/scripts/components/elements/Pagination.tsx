import styled from 'styled-components';

import Button from '@/components/elements/Button';

import { PaginatedResult } from '@/api/http';

import HugeIconsArrowLeft from './hugeicons/ArrowLeft';
import HugeIconsArrowRight from './hugeicons/ArrowRight';

interface RenderFuncProps<T> {
    items: T[];
    isLastPage: boolean;
    isFirstPage: boolean;
}

interface Props<T> {
    data: PaginatedResult<T>;
    showGoToLast?: boolean;
    showGoToFirst?: boolean;
    onPageSelect: (page: number) => void;
    children: (props: RenderFuncProps<T>) => React.ReactNode;
}

const Block = styled(Button)``;

function Pagination<T>({ data: { items, pagination }, onPageSelect, children }: Props<T>) {
    const isFirstPage = pagination.currentPage === 1;
    const isLastPage = pagination.currentPage >= pagination.totalPages;

    const pages = [];

    // Start two spaces before the current page. If that puts us before the starting page default
    // to the first page as the starting point.
    const start = Math.max(pagination.currentPage - 2, 1);
    const end = Math.min(pagination.totalPages, pagination.currentPage + 5);

    for (let i = start; i <= end; i++) {
        // @ts-expect-error - Type issue with array push
        pages.push(i);
    }

    return (
        <>
            {children({ items, isFirstPage, isLastPage })}
            {pages.length > 1 && (
                <div className={`flex justify-center mt-4`}>
                    <div
                        className={`flex justify-center gap-3 p-[4px] w-fit bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#00000017] rounded-md`}
                    >
                        <Block
                            isSecondary
                            color={'primary'}
                            onClick={() =>
                                pagination.currentPage > 1 &&
                                pagination.totalPages > 1 &&
                                onPageSelect(pagination.currentPage - 1)
                            }
                        >
                            <HugeIconsArrowLeft
                                fill={'currentColor'}
                                className={`${pagination.currentPage === 1 ? 'text-neutral-500 cursor-not-allowed' : 'text-white'}`}
                            />
                        </Block>
                        {pages.map((i) => (
                            <Block
                                isSecondary={pagination.currentPage !== i}
                                color={'primary'}
                                key={`block_page_${i}`}
                                onClick={() => onPageSelect(i)}
                            >
                                {i === pagination.currentPage ? (
                                    <span className='text-neutral-500 cursor-not-allowed'>{i}</span>
                                ) : (
                                    i
                                )}
                            </Block>
                        ))}
                        <Block
                            isSecondary
                            color={'primary'}
                            onClick={() =>
                                pagination.currentPage < pagination.totalPages &&
                                onPageSelect(pagination.currentPage + 1)
                            }
                        >
                            <HugeIconsArrowRight
                                fill={'currentColor'}
                                className={`${pagination.currentPage === pagination.totalPages ? 'text-neutral-500 cursor-not-allowed' : 'text-white'}`}
                            />
                        </Block>
                    </div>
                </div>
            )}
        </>
    );
}

export default Pagination;
