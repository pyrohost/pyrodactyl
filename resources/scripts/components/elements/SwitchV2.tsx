'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            'peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-px transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-linear-to-b from-[#ffffff0f] to-[#ffffff0a]',
            'data-[state=checked]:bg-[#fa4f49f5]',
            className,
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'pointer-events-none block h-6 w-6 rounded-full bg-linear-to-br from-[#ffffffcf] to-[#ffffffa1] border shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0.5',
            )}
        />
    </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
