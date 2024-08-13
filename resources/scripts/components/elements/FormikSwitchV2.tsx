import { Field, FieldProps } from 'formik';

import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import SwitchV2Container, { SwitchProps } from '@/components/elements/SwitchV2Container';

const FormikSwitch = ({ name, label, ...props }: SwitchProps) => {
    return (
        <FormikFieldWrapper name={name}>
            <Field name={name}>
                {({ field, form }: FieldProps) => (
                    <SwitchV2Container
                        name={name}
                        label={label}
                        onChange={() => {
                            form.setFieldTouched(name);
                            form.setFieldValue(field.name, !field.value);
                        }}
                        defaultChecked={field.value}
                        {...props}
                    />
                )}
            </Field>
        </FormikFieldWrapper>
    );
};

export default FormikSwitch;
