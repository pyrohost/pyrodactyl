import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
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
                    <h2 className='text-xl font-extrabold mb-2'>Sign in</h2>
                    <div className='text-sm mb-6'>
                        New to Pyro?{' '}
                        <a
                            href='https://pay.pyro.host/register'
                            target='_blank'
                            className='text-[#fa4e49]'
                            rel='noreferrer'
                        >
                            Sign up
                        </a>
                    </div>
                    <Field type={'text'} label={'Username or Email'} name={'username'} disabled={isSubmitting} />
                    <div css={tw`relative mt-6`}>
                        <Field type={'password'} label={'Password'} name={'password'} disabled={isSubmitting} />
                        <Link
                            to={'/auth/password'}
                            css={tw`text-xs text-zinc-500 tracking-wide no-underline hover:text-zinc-600 absolute top-1 right-0`}
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <div className={`mt-6`}>
                        <Button
                            css={tw`mt-4 rounded-full bg-brand border-0 ring-0 outline-none capitalize font-bold text-sm py-2`}
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Login
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

export default LoginContainer;
