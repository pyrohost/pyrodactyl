import { forwardRef } from 'react';
import { Field as FormikField, FieldProps } from 'formik';

interface OwnProps {
    name: string;
    light?: boolean;
    label?: string;
    description?: string;
    validate?: (value: any) => undefined | string | Promise<any>;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const Field = forwardRef<HTMLInputElement, Props>(
    ({ id, name, light = false, label, description, validate, ...props }, ref) => (
        <FormikField innerRef={ref} name={name} validate={validate}>
            {({ field, form: { errors, touched } }: FieldProps) => (
                <div className='flex flex-col gap-2'>
                    {label && (
                        <label className='text-sm text-[#ffffff77]' htmlFor={id}>
                            {label}
                        </label>
                    )}
                    <input
                        className='px-4 py-2 rounded-lg outline-none bg-[#ffffff17] text-sm'
                        id={id}
                        {...field}
                        {...props}
                    />
                    {touched[field.name] && errors[field.name] ? (
                        <p className={'text-sm font-bold text-[#d36666]'}>
                            {(errors[field.name] as string).charAt(0).toUpperCase() +
                                (errors[field.name] as string).slice(1)}
                        </p>
                    ) : description ? (
                        <p className={'text-sm font-bold'}>{description}</p>
                    ) : null}
                </div>
            )}
        </FormikField>
    )
);
Field.displayName = 'Field';

export default Field;
