import { forwardRef, useState } from 'react';
import { ZodError, ZodType } from 'zod';

interface OwnProps {
    name: string;
    label?: string;
    description?: string;
    schema?: ZodType<any, any, any>; // zod schema for validation
    onChange?: (value: string) => void;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'onChange'>;

const Field = forwardRef<HTMLInputElement, Props>(
    ({ id, name, label, description, schema, onChange, ...props }, ref) => {
        const [value, setValue] = useState('');
        const [error, setError] = useState<string | null>(null);
        const [touched, setTouched] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setValue(val);
            if (schema) {
                try {
                    schema.parse(val);
                    setError(null);
                } catch (err) {
                    if (err instanceof ZodError) {
                        setError(err.message || 'Invalid value');
                    }
                }
            }
            onChange?.(val);
        };

        const handleBlur = () => {
            setTouched(true);
            if (schema) {
                try {
                    schema.parse(value);
                    setError(null);
                } catch (err) {
                    if (err instanceof ZodError) {
                        setError(err.message || 'Invalid value');
                    }
                }
            }
        };

        return (
            <div className='flex flex-col gap-2'>
                {label && (
                    <label className='text-sm text-[#ffffff77]' htmlFor={id}>
                        {label}
                    </label>
                )}
                <input
                    className='px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm'
                    id={id}
                    name={name}
                    ref={ref}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...props}
                />
                {touched && error ? (
                    <p className='text-sm font-bold text-[#d36666]'>{error.charAt(0).toUpperCase() + error.slice(1)}</p>
                ) : description ? (
                    <p className='text-sm font-bold'>{description}</p>
                ) : null}
            </div>
        );
    },
);
Field.displayName = 'Field';

export default Field;
