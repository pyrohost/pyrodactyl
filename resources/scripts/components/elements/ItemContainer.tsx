import { useMemo } from 'react';
import { v4 } from 'uuid';

export interface ContainerProps {
    label: string;
    description: string;
    children: React.ReactNode;
    labelClasses?: string;
}

const ItemContainer = ({ label, description, children, labelClasses }: ContainerProps) => {
    const uuid = useMemo(() => v4(), []);

    return (
        <div className='flex items-center justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg'>
            <div className='flex flex-col'>
                <label htmlFor={uuid} className={`text-neutral-300 text-md font-bold ${labelClasses}`}>
                    {label}
                </label>
                <label htmlFor={uuid} className={`text-neutral-500 text-sm font-semibold ${labelClasses}`}>
                    {description}
                </label>
            </div>
            {children}
        </div>
    );
};
ItemContainer.displayName = 'ItemContainer';

export default ItemContainer;
