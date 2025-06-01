import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reaptcha from 'reaptcha';
import { object, string } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';

import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/ApplicationLogo';

interface Values {
    email: string;
}

export default () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });

            return;
        }

        requestPasswordResetEmail(email, token)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setToken('');
                if (ref.current !== null) {
                    void ref.current.reset();
                }

                setSubmitting(false);
            });
    };

    return (
        <ContentBox>
            <Formik
                onSubmit={handleSubmission}
                initialValues={{ email: '' }}
                validationSchema={object().shape({
                    email: string()
                        .email('Please enter your email address to reset your password.')
                        .required('Please enter your email address to reset your password.'),
                })}
            >
                {({ isSubmitting, setSubmitting, submitForm }) => (
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
                        <div className={`mt-6`}>
                            <Button
                                className={`w-full mt-4 rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2`}
                                type={'submit'}
                                size={'xlarge'}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Send Email
                            </Button>
                        </div>
                        {recaptchaEnabled && (
                            <Reaptcha
                                ref={ref}
                                size={'invisible'}
                                sitekey={siteKey || '_invalid_key'}
                                onVerify={(response) => {
                                    setToken(response);
                                    setTimeout(() => {
                                        submitForm();
                                    }, 0);
                                }}
                                onExpire={() => {
                                    setSubmitting(false);
                                    setToken('');
                                }}
                            />
                        )}
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
