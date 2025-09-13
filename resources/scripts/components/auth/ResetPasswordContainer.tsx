import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { object, ref, string } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';

import CaptchaManager from '@/lib/captcha';

import performPasswordReset from '@/api/auth/performPasswordReset';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    password: string;
    password_confirmation: string;
}

function ResetPasswordContainer() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes();
    }, []);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const params = useParams<'token'>();

    const submit = ({ password, password_confirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        const captchaResponse = getCaptchaResponse();

        let resetData: any = { token: params.token ?? '', password, password_confirmation };
        if (CaptchaManager.isEnabled()) {
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            // console.log('Captcha enabled, response:', captchaResponse, 'fieldName:', fieldName);

            if (fieldName) {
                if (captchaResponse) {
                    resetData = {
                        ...resetData,
                        [fieldName]: captchaResponse,
                    };

                    console.log('Adding captcha to reset data:');
                    console.debug(resetData);
                } else {
                    console.error('Captcha enabled but no response available');
                    console.log(captchaResponse);
                    clearAndAddHttpError({ error: new Error(t('auth.captcha.please_complete')) });
                    setSubmitting(false);
                    return;
                }
            }
        }

        performPasswordReset(email, resetData)
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({
                    error: new Error(error),
                });
            });
    };

    return (
        <ContentBox>
            <Formik
                onSubmit={submit}
                initialValues={{
                    password: '',
                    password_confirmation: '',
                }}
                validationSchema={object().shape({
                    password: string()
                        .required(t('auth.validation.password_required_reset'))
                        .min(8, t('auth.validation.password_min_length')),
                    passwordConfirmation: string()
                        .required(t('auth.validation.password_confirmation_required'))
                        .oneOf([ref('password')], t('auth.validation.password_confirmation_mismatch')),
                })}
            >
                {({ isSubmitting }) => (
                    <LoginFormContainer className={`w-full flex`}>
                        <Link to='/'>
                            <div className='flex h-12 mb-4 items-center w-full'>
                                <Logo />
                            </div>
                        </Link>
                        <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>

                        <div className='text-center'>
                            <Input className='text-center' value={email} disabled />
                        </div>
                        <div className={`mt-6`}>
                            <Field
                                label={t('auth.new_password')}
                                name={'password'}
                                type={'password'}
                                description={t('auth.password_requirements')}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Field
                                label={t('auth.confirm_new_password')}
                                name={'passwordConfirmation'}
                                type={'password'}
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

                        <div className={`mt-6`}>
                            <Button
                                className='w-full mt-4 rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2'
                                size={'xlarge'}
                                type={'submit'}
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                            >
                                {t('auth.reset_password')}
                            </Button>
                        </div>
                        <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>

                        <div
                            className={`text-center w-full rounded-lg bg-[#ffffff33] border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 `}
                        >
                            <Link
                                to={'/auth/login'}
                                className={`text-xs text-white tracking-wide uppercase no-underline hover:text-neutral-700 border-color-[#ffffff33] pt-4`}
                            >
                                {t('auth.return_to_login')}
                            </Link>
                        </div>
                    </LoginFormContainer>
                )}
            </Formik>
        </ContentBox>
    );
}

export default ResetPasswordContainer;
