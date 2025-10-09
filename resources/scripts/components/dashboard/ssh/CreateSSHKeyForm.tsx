import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import { createSSHKey } from '@/api/account/ssh-keys';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    name: string;
    publicKey: string;
}

const CreateSSHKeyForm = () => {
    const [sshKey, setSshKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { mutate } = useSSHKeys();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                setSshKey(`${key.name}`);
                mutate((data) => (data || []).concat(key)); // Update the list of SSH keys after creation
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            {/* Flash Messages */}
            <FlashMessageRender byKey='account' />

            {/* Modal for SSH Key */}
            {/* Add your modal logic here to display the SSH key details after creation */}

            {/* Form for creating SSH key */}
            <ContentBox>
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', publicKey: '' }}
                    validationSchema={object().shape({
                        name: string().required('Debes darle un nombre a la clave SSH'),
                        publicKey: string().required('Se requiere una clave pública'),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* SSH Key Name Field */}
                            <FormikFieldWrapper
                                label='Nombre de la clave'
                                name='name'
                                description='Un nombre que te ayude a identificar esta clave.'
                            >
                                <Field name='name' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Public Key Field */}
                            <FormikFieldWrapper
                                label='Clave pública'
                                name='publicKey'
                                description='Introduce tu clave SSH pública.'
                            >
                                <Field name='publicKey' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='flex justify-end mt-6'>
                                <ActionButton type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? 'Creando...' : 'Crear clave SSH'}
                                </ActionButton>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};

export default CreateSSHKeyForm;
