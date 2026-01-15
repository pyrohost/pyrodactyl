import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'select-none border border-solid border-transparent inline-flex items-center transition justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha-200 disabled:pointer-events-none disabled:opacity-50 hover:active:translate-y-0.5 hover:active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-cream-400 text-mocha-500 shadow-sm hover:bg-cream-500/80 hover:active:bg-cream-500/70',
                destructive: 'bg-red-500 shadow-sm text-white hover:bg-red-500/90',
                attention: 'bg-brand-400 text-mocha-500 shadow-sm hover:bg-brand-400/80 hover:active:bg-brand-400/70',
                outline: 'border border-cream-400/80 hover:bg-mocha-300/50 hover:active:bg-mocha-300/20',
                secondary:
                    'bg-mocha-400 border border-mocha-300 text-cream-400 shadow-sm hover:bg-mocha-300 hover:active:bg-mocha-300/50',
                ghost: 'hover:bg-cream-400 hover:text-mocha-500 hover:active:bg-cream-400/70',
                link: 'text-cream-400 underline-offset-4 hover:underline',
                spark: 'bg-linear-0 from-mocha-400 to-[#433B32] border-cream-500/20 text-cream-500 text-lg gap-3',
                ember_faq: 'bg-linear-0 from-mocha-400 to-[#433B32] border-cream-500/20 text-cream-500 gap-3 text-2xl',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-2',
                lg: 'h-14 text-md rounded-2xl px-6',
                ember: 'h-14 text-lg rounded-2xl px-6',
                icon: 'h-8 w-8 rounded-full',
            },
            shape: {
                default: 'rounded-xl',
                round: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            shape: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return <Comp className={cn(buttonVariants({ variant, size, shape, className }))} ref={ref} {...props} />;
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
