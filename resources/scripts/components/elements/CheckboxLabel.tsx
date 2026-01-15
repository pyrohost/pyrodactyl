import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        label?: string;
        checked?: boolean;
        onChange?: (checked: boolean) => void;
    }
>(({ label, checked = false, onChange, className, ...props }, ref) => {
    const handleClick = () => {
        onChange?.(!checked);
    };

    return (
        <div className={cn('flex items-center gap-2 select-none', className)} {...props} ref={ref}>
            {label && (
                <span
                    onClick={handleClick}
                    className={cn(
                        'inline-block rounded-lg w-full px-2 py-1 cursor-pointer transition-colors duration-200 mb-2',
                        checked ? 'bg-brand/40 text-white' : 'border-transparent hover:bg-gray-700/30',
                    )}
                >
                    {label}
                </span>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
