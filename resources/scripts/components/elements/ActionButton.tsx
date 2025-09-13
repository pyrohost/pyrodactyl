import { forwardRef } from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
    ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
        const baseClasses =
            'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed';

        const variantClasses = {
            primary: 'bg-brand text-white hover:bg-brand/80 active:bg-brand/90 border border-brand/20',
            secondary:
                'bg-[#ffffff11] text-[#ffffff88] hover:bg-[#ffffff23] hover:text-[#ffffff] border border-[#ffffff12]',
            danger: 'bg-brand/20 text-red-400 hover:bg-brand/30 hover:text-red-300 border border-brand/40 hover:border-brand/60',
        };

        const sizeClasses = {
            sm: 'h-8 px-3 py-1.5 text-xs',
            md: 'h-10 px-4 py-2 text-sm',
            lg: 'h-12 px-6 py-3 text-base',
        };

        return (
            <button
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    },
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
