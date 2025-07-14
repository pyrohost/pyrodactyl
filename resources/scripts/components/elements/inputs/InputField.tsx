import clsx from 'clsx';
import { forwardRef } from 'react';

import styles from './styles.module.css';

enum Variant {
    Normal,
    Snug,
    Loose,
}

interface InputFieldProps extends React.ComponentProps<'input'> {
    variant?: Variant;
}

const Component = forwardRef<HTMLInputElement, InputFieldProps>(({ className, variant, ...props }, ref) => (
    <input
        ref={ref}
        className={clsx('', styles.text_input, { [styles.loose]: variant === Variant.Loose }, className)}
        {...props}
    />
));

const InputField = Object.assign(Component, { Variants: Variant });

Component.displayName = 'InputField';

export default InputField;
