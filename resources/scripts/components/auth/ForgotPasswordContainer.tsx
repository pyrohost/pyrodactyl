import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { object, string } from 'yup';

import FriendlyCaptcha from '@/components/FriendlyCaptcha';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';

import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    email: string;
}

export default () => {
    const turnstileRef = useRef(null);
    const friendlyCaptchaRef = useRef<{ reset: () => void }>(null);
    const hCaptchaRef = useRef<HCaptcha>(null);

    const [token, setToken] = useState('');
    const [friendlyLoaded, setFriendlyLoaded] = useState(false);

    const { clearFlashes, addFlash } = useFlash();
    const { captcha } = useStoreState((state) => state.settings.data!);
    const isTurnstileEnabled = captcha.driver === 'turnstile' && captcha.turnstile?.siteKey;
    const isFriendlyEnabled = captcha.driver === 'friendly' && captcha.friendly?.siteKey;
    const isHCaptchaEnabled = captcha.driver === 'hcaptcha' && captcha.hcaptcha?.siteKey;
    const isMCaptchaEnabled = captcha.driver === 'mcaptcha' && captcha.mcaptcha?.siteKey;

    useEffect(() => {
        clearFlashes();

        if (isFriendlyEnabled && !window.friendlyChallenge) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/friendly-challenge@0.9.12/widget.module.min.js';
            script.async = true;
            script.defer = true;
            script.onload = () => setFriendlyLoaded(true);
            document.body.appendChild(script);
        } else if (isFriendlyEnabled) {
            setFriendlyLoaded(true);
        }
    }, []);

    const handleCaptchaComplete = (response: string) => {
        setToken(response);
    };

    const handleCaptchaError = (provider: string) => {
        setToken('');
        addFlash({ type: 'error', title: 'CAPTCHA Error', message: `${provider} challenge failed.` });
    };

    const handleCaptchaExpire = () => {
        setToken('');
    };

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        if ((isTurnstileEnabled || isFriendlyEnabled || isHCaptchaEnabled) && !token) {
            addFlash({ type: 'error', title: 'Error', message: 'Please complete the CAPTCHA challenge.' });
            setSubmitting(false);
            return;
        }

        const requestData: Record<string, string> = { email };

        if (isTurnstileEnabled) {
            requestData['cf-turnstile-response'] = token;
        } else if (isHCaptchaEnabled) {
            requestData['h-captcha-response'] = token;
        } else if (isFriendlyEnabled) {
            requestData['frc-captcha-response'] = token;
        } else if (isMCaptchaEnabled) {
            requestData['g-recaptcha-response'] = token; // Fallback or mCaptcha field
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
                setToken('');
                // Reset CAPTCHAs...
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

                        {/* CAPTCHA Components */}
                        {isTurnstileEnabled && (
                            <div className='mt-6'>
                                <Turnstile
                                    ref={turnstileRef}
                                    siteKey={captcha.turnstile.siteKey}
                                    onSuccess={handleCaptchaComplete}
                                    onError={() => handleCaptchaError('Turnstile')}
                                    onExpire={handleCaptchaExpire}
                                    options={{
                                        theme: 'dark',
                                        size: 'flexible',
                                    }}
                                />
                            </div>
                        )}
                        {isFriendlyEnabled && friendlyLoaded && (
                            <div className='mt-6 w-full'>
                                <FriendlyCaptcha
                                    ref={friendlyCaptchaRef}
                                    sitekey={captcha.friendly.siteKey}
                                    onComplete={handleCaptchaComplete}
                                    onError={() => handleCaptchaError('FriendlyCaptcha')}
                                    onExpire={handleCaptchaExpire}
                                />
                            </div>
                        )}
                        {isHCaptchaEnabled && (
                            <div className='mt-6'>
                                <HCaptcha
                                    ref={hCaptchaRef}
                                    sitekey={captcha.hcaptcha.siteKey}
                                    onVerify={handleCaptchaComplete}
                                    onError={() => handleCaptchaError('hCaptcha')}
                                    onExpire={handleCaptchaExpire}
                                    theme='dark'
                                />
                            </div>
                        )}
                        {isMCaptchaEnabled && (
                            <div className='mt-6'>
                                <p className='text-red-500'>mCaptcha implementation needed</p>
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
