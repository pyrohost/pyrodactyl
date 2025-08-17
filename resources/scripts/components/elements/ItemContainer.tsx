import React, { useMemo } from 'react';
import { v4 } from 'uuid';

import CopyOnClick from './CopyOnClick';

export interface ContainerProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string; fill?: string }>;
    labelClasses?: string;
    titleClasses?: string;
    descriptionClasses?: string;
    divClasses?: string;
    copyDescription?: boolean;
}

const ItemContainer = ({
    title,
    description,
    children,
    icon,
    labelClasses,
    titleClasses,
    descriptionClasses,
    divClasses,
    copyDescription,
}: ContainerProps) => {
    const uuid = useMemo(() => v4(), []);

    return (
        <div
            className={`flex items-center justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg ${divClasses}`}
        >
            {icon && (
                <div className={`w-10 h-10 items-center justify-center hidden sm:flex`}>
                    {React.createElement(icon, { className: 'w-6 h-6', fill: 'currentColor' })}
                </div>
            )}
            <div className={`flex flex-1 flex-col`}>
                <label htmlFor={uuid} className={`text-neutral-300 text-md font-bold ${titleClasses} ${labelClasses}`}>
                    {title}
                </label>

                {/* i don't like how this duplicates the element, but idk how to get it working otherwise */}
                {copyDescription ? (
                    <CopyOnClick text={description}>
                        <label
                            htmlFor={uuid}
                            className={`text-neutral-500 text-sm font-semibold ${descriptionClasses} ${labelClasses}`}
                        >
                            {description}
                        </label>
                    </CopyOnClick>
                ) : (
                    <label
                        htmlFor={uuid}
                        className={`text-neutral-500 text-sm font-semibold ${descriptionClasses} ${labelClasses}`}
                    >
                        {description}
                    </label>
                )}
            </div>
            {children}
        </div>
    );
};
ItemContainer.displayName = 'ItemContainer';

export default ItemContainer;
