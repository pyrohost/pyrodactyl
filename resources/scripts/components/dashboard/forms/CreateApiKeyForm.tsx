import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { Fragment } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';

import createApiKey from '@/api/account/createApiKey';
import { ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    description: string;
    allowedIps: string;
}

const CreateApiKeyForm = ({ onKeyCreated }: { onKeyCreated: (key: ApiKey) => void }) => {
    const [apiKey, setApiKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('account');
        createApiKey(values.description, values.allowedIps)
            .then(({ secretToken, ...key }) => {
                resetForm();
                setSubmitting(false);
                setApiKey(`${key.identifier}${secretToken}`);
                onKeyCreated(key);
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
            <FlashMessageRender byKey='account' />

            {/* Modal for API Key */}
            <ApiKeyModal visible={apiKey.length > 0} onModalDismissed={() => setApiKey('')} apiKey={apiKey} />

            {/* Form for creating API key */}
            <ContentBox>
                <Formik
                    onSubmit={submit}
                    initialValues={{ description: '', allowedIps: '' }}
                    validationSchema={object().shape({
                        allowedIps: string(),
                        description: string().required().min(4),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* Description Field */}
                            <FormikFieldWrapper
                                label='Descripción'
                                name='description'
                                description='Una descripción para tu clave API.'
                            >
                                <Field name='description' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Allowed IPs Field */}
                            <FormikFieldWrapper
                                label='IPs permitidas'
                                name='allowedIps'
                                description='Déjalo en blanco para permitir la conexión desde cualquier IP, o pon cada dirección en una nueva línea para restringir el acceso.'
                            >
                                <Field name='allowedIps' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='flex justify-end mt-6'>
                                <Button type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? 'Creando...' : 'Crear clave API'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};

CreateApiKeyForm.displayName = 'CreateApiKeyForm';
export default CreateApiKeyForm;
