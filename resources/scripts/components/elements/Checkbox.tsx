import { Field, FieldProps } from 'formik';

import Input from '@/components/elements/Input';

interface Props {
    name: string;
    value: string;
    className?: string;
}

type OmitFields = 'ref' | 'name' | 'value' | 'type' | 'checked' | 'onClick' | 'onChange';

type InputProps = Omit<JSX.IntrinsicElements['input'], OmitFields>;

const Checkbox = ({ name, value, className, ...props }: Props & InputProps) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => {
            if (!Array.isArray(field.value)) {
                console.error('Attempting to mount a checkbox using a field value that is not an array.');

                return null;
            }

            return (
                <Input
                    {...field}
                    {...props}
                    className={className}
                    type={'checkbox'}
                    checked={(field.value || []).includes(value)}
                    onClick={() => form.setFieldTouched(field.name, true)}
                    onChange={(e) => {
                        const set = new Set(field.value);
                        if (set.has(value)) {
                            set.delete(value);
                        } else {
                            set.add(value);
                        }

                        field.onChange(e);
                        form.setFieldValue(field.name, Array.from(set));
                    }}
                />
            );
        }}
    </Field>
);

export default Checkbox;
