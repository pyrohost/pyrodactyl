'use client';

import { MinusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';

import { cn } from '@/lib/utils';

function InputOTP({
    className,
    containerClassName,
    ...props
}: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string;
}) {
    return (
        <OTPInput
            data-slot='input-otp'
            containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
            className={cn('disabled:cursor-not-allowed', className)}
            {...props}
        />
    );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot='input-otp-group' className={cn('flex items-center', className)} {...props} />;
}

function InputOTPSlot({
    index,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    index: number;
}) {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

    return (
        <div
            data-slot='input-otp-slot'
            data-active={isActive}
            className={cn(
                'data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex items-center justify-center border-y border-r text-xs shadow-xs transition-all outline-none first:rounded-l-xl first:border-l last:rounded-r-xl data-[active=true]:z-10 data-[active=true]:ring-[3px]',
                'size-14 text-xl border-secondary ring-amber-600 bg-bg-raised',
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                    <div className='animate-caret-blink bg-foreground h-4 w-px duration-1000' />
                </div>
            )}
        </div>
    );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
    return (
        <div data-slot='input-otp-separator' role='separator' {...props}>
            <HugeiconsIcon icon={MinusSignIcon} />
        </div>
    );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
