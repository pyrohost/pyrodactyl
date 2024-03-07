import { memo } from 'react';
import isEqual from 'react-fast-compare';

interface Props {
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ title, children }: Props) => (
    <div className={`relative rounded-xl overflow-hidden shadow-md border-[1px] border-[#ffffff07] bg-[#ffffff08] p-8`}>
        <div>
            {typeof title === 'string' ? (
                <p className={`text-xl font-extrabold tracking-tight mb-4`}>{title}</p>
            ) : (
                title
            )}
        </div>
        <div className='w-full h-full'>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
