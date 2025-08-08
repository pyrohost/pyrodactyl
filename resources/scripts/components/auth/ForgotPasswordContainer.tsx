import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { object, string } from 'yup';

import Captcha from '@/components/Captcha';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    email: string;
}

const ForgotPasswordContainer = () => {
    const captchaRef = useRef<any>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const { captcha } = useStoreState((state) => state.settings.data!);

    const isCaptchaEnabled = captcha.driver !== 'none' && captcha.driver !== undefined;
    
    let siteKey = '';
    if (captcha.driver === 'turnstile') {
        siteKey = captcha.turnstile?.siteKey || '';
    } else if (captcha.driver === 'hcaptcha') {
        siteKey = captcha.hcaptcha?.siteKey || '';
    } else if (captcha.driver === 'friendly') {
        siteKey = captcha.friendly?.siteKey || '';
    } else if (captcha.driver === 'mcaptcha') {
        siteKey = captcha.mcaptcha?.siteKey || '';
    }

    const resetCaptcha = () => {
        setToken('');
        if (captchaRef.current && typeof captchaRef.current.reset === 'function') {
            captchaRef.current.reset();
        }
    };

    const handleCaptchaSuccess = (response: string) => {
        setToken(response);
    };

    const handleCaptchaError = () => {
        setToken('');
        addFlash({ type: 'error', title: 'CAPTCHA Error', message: 'CAPTCHA challenge failed. Please try again.' });
    };

    const handleCaptchaExpire = () => {
        setToken('');
    };

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // Validate CAPTCHA if enabled
        if (isCaptchaEnabled && !token) {
            addFlash({ type: 'error', title: 'Error', message: 'Please complete the CAPTCHA challenge.' });
            setSubmitting(false);
            return;
        }

        const requestData: any = { email };

        // Add CAPTCHA token based on provider
        if (isCaptchaEnabled && token) {
            switch (captcha.driver) {
                case 'turnstile':
                    requestData['cf-turnstile-response'] = token;
                    break;
                case 'hcaptcha':
                    requestData['h-captcha-response'] = token;
                    break;
                case 'friendly':
                    requestData['frc-captcha-response'] = token;
                    break;
                case 'mcaptcha':
                    requestData['mcaptcha-response'] = token;
                    break;
            }
        }

        http.post('/auth/password', requestData)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response.data.status || 'Email sent!' });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .finally(() => {
                resetCaptcha();
                setSubmitting(false);
            });
    };

    return (
        <ContentBox>
            <Formik
                onSubmit={handleSubmission}
                initialValues={{ email: '' }}
                validationSchema={object().shape({
                    email: string().email('Enter a valid email address.').required('Email is required.'),
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
                        <h2 className='text-xl font-extrabold mb-2'>Reset Password</h2>
                        <div className='text-sm mb-6'>
                            We&apos;ll send you an email with a link to reset your password.
                        </div>
                        <Field id='email' label={'Email'} name={'email'} type={'email'} />

                        {/* CAPTCHA Component */}
                        {isCaptchaEnabled && siteKey && (
                            <div className='mt-6 flex justify-center'>
                                <Captcha
                                    ref={captchaRef}
                                    driver={captcha.driver}
                                    sitekey={siteKey}
                                    theme={(captcha.turnstile as any)?.theme || 'dark'}
                                    size={(captcha.turnstile as any)?.size || 'flexible'}
                                    action={(captcha.turnstile as any)?.action}
                                    cData={(captcha.turnstile as any)?.cdata}
                                    onVerify={handleCaptchaSuccess}
                                    onError={handleCaptchaError}
                                    onExpire={handleCaptchaExpire}
                                    className=""
                                />
                            </div>
                        )}

                        <div className='mt-6'>
                            <Button
                                className={`w-full mt-4 rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2`}
                                type='submit'
                                size='xlarge'
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Send Email
                            </Button>
                        </div>

                        <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                        <div
                            className={`text-center w-full rounded-lg border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 `}
                        >
                            <Link
                                to='/auth/login'
                                className='block w-full text-center py-2.5 px-4 text-xs font-medium tracking-wide uppercase text-white hover:text-white/80 transition-colors duration-200 border border-white/20 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
                            >
                                Return to Login
                            </Link>
                        </div>
                    </LoginFormContainer>
                )}
            </Formik>
        </ContentBox>
    );
};

export default ForgotPasswordContainer;
