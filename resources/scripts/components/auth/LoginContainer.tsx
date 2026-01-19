import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { object, string } from 'yup';
import login from '@/api/auth/login';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import CaptchaManager from '@/lib/captcha';

import useFlash from '@/plugins/useFlash';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    user: string;
    password: string;
}

interface ErrorResponse {
    response: string;
    message: string;
    detail: string;
    code: string;
}


function LoginContainer() {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();

    // useEffect(() => {
    //     clearFlashes();
    // }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        // clearFlashes();

        let loginData: Values = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    loginData = { ...values, [fieldName]: captchaResponse };
                } else {
                    console.error('Captcha enabled but no response available');
                    clearAndAddHttpError({
                        error: new Error('Please complete the captcha verification.'),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        } else { }

        login(loginData)
            .then((response) => {
                if (response.complete) {
                    clearFlashes();
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', {
                    state: { token: response.confirmationToken },
                });
            })
            .catch((error: ErrorResponse) => {
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({
                        error: new Error('Invalid username or password. Please try again.'),
                    });
                } else if (error.code === 'DisplayException') {
                    clearAndAddHttpError({
                        error: new Error(error.detail || error.message),
                    });
                } else {
                    clearAndAddHttpError({ error });
                }
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ user: '', password: '' }}
            validationSchema={object().shape({
                user: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={`flex flex-col gap-6`}>
                    <TitleSection title='Login' />
                    <div className=''>
                        <Field
                            id='user'
                            type={'text'}
                            label={'Username or Email'}
                            name={'user'}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className={`relative mt-6`}>
                        <Field
                            id='password'
                            type={'password'}
                            label={'Password'}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            clearAndAddHttpError({
                                error: new Error('Captcha verification failed. Please try again.'),
                            });
                        }}
                    />

                    <div className='flex w-full justify-between items-center'>
                        <Button
                            className={`bg-mocha-100 rounded-full p-2 px-4 text-black hover:cursor-pointer hover:bg-mocha-200 hover:scale-102 ease-in-out`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Sign in
                        </Button>
                        <SecondaryLink to='/auth/password'>Forgot your password?</SecondaryLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default LoginContainer;
