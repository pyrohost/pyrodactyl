import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { Dialog } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

interface CreateValues {
    description: string;
    allowedIps: string;
}

interface CreateApiKeyModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: CreateValues, helpers: FormikHelpers<CreateValues>) => void;
    isSubmitting?: boolean;
}

const validationSchema = object().shape({
    description: string().required('Description is required').min(4, 'Must be at least 4 characters'),
    allowedIps: string(),
});

export default function CreateApiKeyModal({ open, onClose, onSubmit, isSubmitting = false }: CreateApiKeyModalProps) {
    return (
        <Dialog.Confirm
            open={open}
            onClose={onClose}
            title='Create API Key'
            confirm='Create Key'
            onConfirmed={() => {
                // Trigger form submission programmatically
                const form = document.getElementById('create-api-form') as HTMLFormElement;
                if (form) {
                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) submitButton.click();
                }
            }}
            // Optional: disable confirm button while submitting
            confirmDisabled={isSubmitting}
        >
            <Formik
                initialValues={{ description: '', allowedIps: '' }}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting: formikIsSubmitting }) => (
                    <Form id='create-api-form' className='space-y-4'>
                        <SpinnerOverlay visible={formikIsSubmitting || isSubmitting} />

                        <FormikFieldWrapper
                            label='Description'
                            name='description'
                            description='A description of this API key.'
                        >
                            <Field name='description' as={Input} className='w-full' autoFocus />
                        </FormikFieldWrapper>

                        <FormikFieldWrapper
                            label='Allowed IPs'
                            name='allowedIps'
                            description={
                                'Leave blank to allow any IP address. ' +
                                'Otherwise provide each IP or CIDR range on a new line (e.g. 192.168.1.1, 10.0.0.0/24).'
                            }
                        >
                            <Field
                                name='allowedIps'
                                as='textarea'
                                rows={4}
                                className='w-full rounded bg-[#ffffff0d] border border-[#ffffff12] p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500'
                            />
                        </FormikFieldWrapper>

                        {/* Hidden submit button — triggered by Dialog confirm */}
                        <button type='submit' className='hidden' />
                    </Form>
                )}
            </Formik>
        </Dialog.Confirm>
    );
}
