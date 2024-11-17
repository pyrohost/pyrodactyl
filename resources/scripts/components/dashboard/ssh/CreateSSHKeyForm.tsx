import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';

import Button from '@/components/elements/Button';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';

import { createSSHKey } from '@/api/account/ssh-keys';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    name: string;
    publicKey: string;
}

export default () => {
    const [sshKey, setSshKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { mutate } = useSSHKeys();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('account');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                setSshKey(`${key.name}`);
                mutate((data) => (data || []).concat(key));  // Update the list of SSH keys after creation
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            {/* Flash Messages */}
            <FlashMessageRender byKey="account" />

            {/* Modal for SSH Key */}
            {/* Add your modal logic here to display the SSH key details after creation */}

            {/* Form for creating SSH key */}
            <Formik
                onSubmit={submit}
                initialValues={{ name: '', publicKey: '' }}
                validationSchema={object().shape({
                    name: string().required('SSH Key Name is required'),
                    publicKey: string().required('Public Key is required'),
                })}
            >
                {({ isSubmitting }) => (
                    <Form className="space-y-6">
                        {/* Show spinner overlay when submitting */}
                        <SpinnerOverlay visible={isSubmitting} />

                        {/* SSH Key Name Field */}
                        <FormikFieldWrapper
                            label="SSH Key Name"
                            name="name"
                            description="A name to identify this SSH key."
                        >
                            <Field name="name" as={Input} />
                        </FormikFieldWrapper>

                        {/* Public Key Field */}
                        <FormikFieldWrapper
                            label="Public Key"
                            name="publicKey"
                            description="Enter your public SSH key."
                        >
                            <Field name="publicKey" as={Input} />
                        </FormikFieldWrapper>

                        {/* Submit Button below form fields */}
                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create SSH Key'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};
