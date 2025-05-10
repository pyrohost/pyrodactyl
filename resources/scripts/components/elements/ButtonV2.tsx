import clsx from 'clsx';
import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

const Button = ({ className, ...props }: Props) => {
    return (
        <button
            className={clsx(
                'flex items-center justify-center h-8 px-4 text-sm font-medium text-white transition-colors duration-150 bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-full shadow-xs hover:from-[#ffffff05] hover:to-[#ffffff04] cursor-pointer',
                className,
            )}
            {...props}
        />
    );
};
Button.displayName = 'Button';

export default Button;
