import { Check } from '@gravity-ui/icons';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            'peer h-5 w-5 shrink-0 rounded-md border-2 border-[#ffffff66] shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[deepskyblue] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand data-[state=checked]:text-primary-foreground',
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className={cn('flex h-full w-full items-center justify-center text-current')}>
            <Check width={22} height={22} fill='currentColor' />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
