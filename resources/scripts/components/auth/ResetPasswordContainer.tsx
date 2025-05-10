import { Actions, useStoreActions } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { object, ref, string } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';

import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

import Logo from '../elements/PyroLogo';

interface Values {
    password: string;
    passwordConfirmation: string;
}

function ResetPasswordContainer() {
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const params = useParams<'token'>();

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: params.token ?? '', password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <ContentBox>
            <Formik
                onSubmit={submit}
                initialValues={{
                    password: '',
                    passwordConfirmation: '',
                }}
                validationSchema={object().shape({
                    password: string()
                        .required('A new password is required.')
                        .min(8, 'Your new password should be at least 8 characters in length.'),
                    passwordConfirmation: string()
                        .required('Your new password does not match.')
                        .oneOf([ref('password')], 'Your new password does not match.'),
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
                            {/* <label>Email</label> */}
                            <Input className='text-center' value={email} isLight disabled />
                        </div>
                        <div className={`mt-6`}>
                            <Field
                                light
                                label={'New Password'}
                                name={'password'}
                                type={'password'}
                                description={'Passwords must be at least 8 characters in length.'}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Field
                                light
                                label={'Confirm New Password'}
                                name={'passwordConfirmation'}
                                type={'password'}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Button
                                className='w-full mt-4 rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2'
                                size={'xlarge'}
                                type={'submit'}
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                            >
                                Reset Password
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
                                Return to Login
                            </Link>
                        </div>
                    </LoginFormContainer>
                )}
            </Formik>
        </ContentBox>
    );
}

export default ResetPasswordContainer;
