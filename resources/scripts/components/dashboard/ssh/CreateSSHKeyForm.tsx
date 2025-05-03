import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';

import { createSSHKey } from '@/api/account/ssh-keys';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    name: string;
    publicKey: string;
}

export default () => {
    const { t } = useTranslation();
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
                mutate((data) => (data || []).concat(key)); // Update the list of SSH keys after creation
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

            {/* Modal for SSH Key */}
            {/* Add your modal logic here to display the SSH key details after creation */}

            {/* Form for creating SSH key */}
            <ContentBox>
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', publicKey: '' }}
                    validationSchema={object().shape({
                        name: string().required(t('ssh_key.name_required')),
                        publicKey: string().required(t('ssh_key.public_key_required')),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* SSH Key Name Field */}
                            <FormikFieldWrapper
                                label={t('ssh_key.name')}
                                name='name'
                                description={t('ssh_key.name_description')}
                            >
                                <Field name='name' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Public Key Field */}
                            <FormikFieldWrapper
                                label={t('ssh_key.public_key')}
                                name='publicKey'
                                description={t('ssh_key.public_key_description')}
                            >
                                <Field name='publicKey' as={Input} className='w-full' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='flex justify-end mt-6'>
                                <Button type='submit' disabled={isSubmitting}>
                                    {isSubmitting ? t('ssh_key.creating') : t('ssh_key.create')}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};
