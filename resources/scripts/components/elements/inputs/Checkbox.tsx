import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type Props = Omit<React.ComponentProps<'input'>, 'type'>;

export default forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => (
    <input ref={ref} type={'checkbox'} className={clsx('form-input', styles.checkbox_input, className)} {...props} />
));
