import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { object, string } from 'yup';

import Captcha from '@/components/Captcha';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import Logo from '@/components/elements/PyroLogo';

import login from '@/api/auth/login';

import useFlash from '@/plugins/useFlash';

interface Values {
    user: string;
    password: string;
}

function LoginContainer() {
    const [token, setToken] = useState('');
    const captchaRef = useRef<any>(null);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { captcha } = useStoreState((state) => state.settings.data!);
    
    const navigate = useNavigate();

    useEffect(() => {
        clearFlashes();
    }, []);

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
        clearAndAddHttpError({ error: new Error('CAPTCHA challenge failed. Please try again.') });
    };

    const handleCaptchaExpire = () => {
        setToken('');
    };

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

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // Validate CAPTCHA if enabled
        if (isCaptchaEnabled && !token) {
            setSubmitting(false);
            clearAndAddHttpError({ error: new Error('Please complete the CAPTCHA challenge.') });
            return;
        }

        const requestData: any = {
            user: values.user,
            password: values.password,
        };

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

        login(requestData)
            .then((response) => {
                if (response.complete) {
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', { state: { token: response.confirmationToken } });
            })
            .catch((error: any) => {
                console.error('Login error details:', {
                    message: error.message,
                    detail: error.detail,
                    code: error.code,
                    response: error.response,
                });

                resetCaptcha();
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({ error: new Error('Invalid username or password. Please try again.') });
                } else if (error.code === 'DisplayException') {
                    clearAndAddHttpError({ error: new Error(error.detail || error.message) });
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
                <LoginFormContainer className={`w-full flex`}>
                    <div className='flex h-12 mb-4 items-center w-full'>
                        <Logo />
                    </div>
                    <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                    <h2 className='text-xl font-extrabold mb-2'>Login</h2>
                    
                    <Field 
                        id='user' 
                        type={'text'} 
                        label={'Username or Email'} 
                        name={'user'} 
                        disabled={isSubmitting} 
                    />
                    
                    <div className={`relative mt-6`}>
                        <Field
                            id='password'
                            type={'password'}
                            label={'Password'}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                        <Link
                            to={'/auth/password'}
                            className={`text-xs text-zinc-500 tracking-wide no-underline hover:text-zinc-600 absolute top-1 right-0`}
                        >
                            Forgot Password?
                        </Link>
                    </div>

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

                    <div className={`mt-6`}>
                        <Button
                            className={`relative mt-4 w-full rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 hover:cursor-pointer`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Login
                        </Button>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default LoginContainer;
