import * as React from 'react';

import { cn } from '@/lib/utils';

const CheckboxArrow = React.forwardRef<
    React.ElementRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & { label?: string; onChange?: () => void; toggleable?: boolean }
>(({ className, label, onChange, toggleable = true, ...props }, ref) => {
    const [checked, setChecked] = React.useState(false);

    const toggleChecked = () => {
        if (!toggleable) return;
        setChecked((prev) => {
            const newCheckedState = !prev;
            if (onChange) onChange();
            return newCheckedState;
        });
    };

    return (
        <div className='flex items-center gap-2 select-none'>
            {label && (
                <span
                    onClick={toggleChecked}
                    className={'inline-block rounded-lg w-full px-2 py-1 cursor-pointer transition-colors duration-200'}
                    {...props}
                    ref={ref}
                >
                    {label}
                </span>
            )}
        </div>
    );
});

CheckboxArrow.displayName = 'CheckboxArrow';

export { CheckboxArrow };
