import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { object, string } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import Logo from '@/components/elements/PyroLogo';

import CaptchaManager from '@/lib/captcha';

import login from '@/api/auth/login';

import useFlash from '@/plugins/useFlash';

interface Values {
    user: string;
    password: string;
}

function LoginContainer() {
    const { t } = useTranslation();

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        let loginData: any = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            console.log('Captcha enabled, response:', captchaResponse, 'fieldName:', fieldName);

            if (fieldName) {
                if (captchaResponse) {
                    loginData = { ...values, [fieldName]: captchaResponse };
                    console.log('Adding captcha to login data:', loginData);
                } else {
                    console.error(t('auth.captcha.no_response'));
                    clearAndAddHttpError({
                        error: new Error(t('auth.captcha.please_complete')),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        } else {
            console.log('Captcha not enabled');
        }

        login(loginData)
            .then((response) => {
                if (response.complete) {
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', {
                    state: { token: response.confirmationToken },
                });
            })
            .catch((error: any) => {
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({
                        error: new Error(t('auth.validation.invalid_username_password')),
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
                user: string().required(t('auth.validation.username_required')),
                password: string().required(t('auth.validation.password_required')),
            })}
        >
            {({ isSubmitting, isValid }) => (
                <LoginFormContainer className={`w-full flex`}>
                    <div className='flex h-12 mb-4 items-center w-full'>
                        <Logo />
                    </div>
                    <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                    <h2 className='text-xl font-extrabold mb-2'>{t('auth.login')}</h2>
                    <Field
                        id='usernameOrEmail'
                        type={'text'}
                        label={t('auth.username_or_email')}
                        name={'user'}
                        disabled={isSubmitting}
                    />
                    <div className={`relative mt-6`}>
                        <Field
                            id='password'
                            type={'password'}
                            label={t('auth.password')}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                        <Link
                            to={'/auth/password'}
                            className={`text-xs text-zinc-500 tracking-wide no-underline hover:text-zinc-600 absolute top-1 right-0`}
                        >
                            {t('auth.forgot_password')}
                        </Link>
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            clearAndAddHttpError({
                                error: new Error(t('auth.captcha.verification_failed')),
                            });
                        }}
                    />

                    <div className={`mt-6`}>
                        <Button
                            className={`relative mt-4 w-full rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 hover:cursor-pointer`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting || !isValid}
                        >
                            {t('auth.login')}
                        </Button>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default LoginContainer;
