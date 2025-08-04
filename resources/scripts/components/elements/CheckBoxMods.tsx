import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

import styles from './styles.module.css';

type Props = Omit<React.ComponentProps<'input'>, 'type'> & {
    label?: string; // Optional label text for better accessibility
    inputField?: boolean; // Optional flag to display an input field
};

const CheckBox = forwardRef<HTMLInputElement, Props>(({ className, label, inputField, ...props }, ref) => (
    <div className={cn('flex items-center', className)}>
        <input
            ref={ref}
            type='checkbox'
            className={cn(
                'form-input',
                styles.checkbox_input,
                'accent-branding', // Use the custom branding color for the checkbox accent
                {
                    [styles.with_input]: inputField, // Add custom styles when the input field is enabled
                },
            )}
            {...props}
        />
        {label && <label className={cn('ml-2', styles.label)}>{label}</label>}
        {inputField && <input type='text' className={cn('ml-2', 'form-input', styles.input_field, 'border-brand')} />}
    </div>
));

CheckBox.displayName = 'CheckBox';

export default CheckBox;
