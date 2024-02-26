import React, { memo } from 'react';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ title, children, className }: Props) => (
    <div
        css={tw`rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] p-8`}
        className={className}
    >
        <div>
            {typeof title === 'string' ? <p css={tw`text-xl font-extrabold tracking-tight mb-4`}>{title}</p> : title}
        </div>
        <div className='w-full h-full'>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
