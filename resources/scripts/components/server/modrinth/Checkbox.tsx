import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    React.ElementRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & { label?: string; onChange?: () => void }
>(({ className, label, onChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(false);

    const toggleChecked = () => {
        setChecked((prev) => {
            const newCheckedState = !prev;
            if (onChange) onChange(); // Call the onChange handler when the checkbox is toggled
            return newCheckedState;
        });
    };

    return (
        <div className='flex items-center gap-2 select-none'>
            {label && (
                <span onClick={toggleChecked}>
                    <span
                        onClick={toggleChecked}
                        className={cn(
                            'inline-block rounded-lg w-full px-2 py-1 cursor-pointer transition-colors duration-200',
                            checked
                                ? 'bg-green-800 text-white mb-2 select-none'
                                : 'border-transparent hover:bg-gray-700 mb-2 select-none',
                        )}
                        {...props}
                        ref={ref}
                    >
                        {label}
                    </span>
                </span>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
