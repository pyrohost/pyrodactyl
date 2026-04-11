import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { object, string } from 'yup';
import http, { httpErrorToHuman } from '@/api/http';
import LoginFormContainer, { ReturnToLogin, TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';
import CaptchaManager from '@/lib/captcha';

import SecondaryLink from '../ui/secondary-link';
import useFlash from '@/plugins/useFlash';


interface Values {
    email: string;
}

const ForgotPasswordContainer = () => {
    const { clearFlashes, addFlash } = useFlash();

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        const captchaResponse = getCaptchaResponse();

        let requestData: any = { email };
        if (CaptchaManager.isEnabled() && captchaResponse) {
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();
            if (fieldName) {
                requestData = { ...requestData, [fieldName]: captchaResponse };
            }
        }

        http.post('/auth/password', requestData)
            .then((response) => {
                resetForm();
                addFlash({
                    type: 'success',
                    title: 'Success',
                    message: response.data.status || 'Email sent!',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string().email('Enter a valid email address.').required('Email is required.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={`w-full flex flex-col`}>
                    <TitleSection title='Forgot Password' />
                    <div className='text-sm mb-6'>
                        We&apos;ll send you an email with a link to reset your password.
                    </div>
                    <Field id='email' label={'Email'} name={'email'} type={'email'} />

                    <div className='flex w-full justify-between items-center'>
                        <Button
                            className={`bg-mocha-100 text-black p-2 px-4 mt-4 rounded-full border-0 ring-0 outline-hidden capitalize`}
                            type='submit'
                            size='xlarge'
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Send Email
                        </Button>

                        <SecondaryLink to='/auth/password'>Forgot your password?</SecondaryLink>
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            addFlash({
                                type: 'error',
                                title: 'Error',
                                message: 'Captcha verification failed. Please try again.',
                            });
                        }}
                    />

                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default ForgotPasswordContainer;
