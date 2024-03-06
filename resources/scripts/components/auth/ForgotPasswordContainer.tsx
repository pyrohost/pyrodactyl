import { useStoreState } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import Reaptcha from 'reaptcha';
import tw from 'twin.macro';
import { object, string } from 'yup';

import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import useFlash from '@/plugins/useFlash';

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
                <LoginFormContainer css={tw`w-full flex`}>
                    <div className='flex items-start h-12 w-fit mb-4'>
                        {/* temp src */}
                        <img
                            className='w-full max-w-full h-full'
                            loading='lazy'
                            decoding='async'
                            alt=''
                            aria-hidden
                            style={{
                                color: 'transparent',
                            }}
                            src='https://i.imgur.com/Hbum4fc.png'
                        />
                    </div>
                    <h2 className='text-xl font-extrabold mb-2'>Reset Password</h2>
                    <div className='text-sm mb-6'>We'll send you an email with a link to reset your password.</div>
                    <Field label={'Email'} name={'email'} type={'email'} />
                    <div className={`mt-6`}>
                        <Button
                            css={tw`mt-4 rounded-full bg-brand border-0 ring-0 outline-none capitalize font-bold text-sm py-2`}
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
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                </LoginFormContainer>
            )}
        </Formik>
    );
};
