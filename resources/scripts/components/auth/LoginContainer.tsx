import { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
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

const LoginContainer = ({ history }: RouteComponentProps) => {
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
                        <svg
                            className='flex h-full w-full shrink-0'
                            width='190'
                            height='84'
                            viewBox='0 0 190 84'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M28.0463 65.8185C28.0463 64.4823 28.0463 63.8142 28.1571 63.2586C28.612 60.9771 30.3999 59.1936 32.687 58.7398C33.2439 58.6293 33.9136 58.6293 35.2531 58.6293C36.5926 58.6293 37.2623 58.6293 37.8192 58.7398C40.1063 59.1936 41.8942 60.9771 42.3491 63.2586C42.4599 63.8142 42.4599 64.4823 42.4599 65.8185V68.215C42.4599 70.0067 42.4599 70.9026 42.0737 71.57C41.8207 72.0071 41.4567 72.3701 41.0185 72.6225C40.3496 73.0078 39.4515 73.0078 37.6554 73.0078H32.8508C31.0547 73.0078 30.1566 73.0078 29.4877 72.6225C29.0494 72.3701 28.6855 72.0071 28.4325 71.57C28.0463 70.9026 28.0463 70.0067 28.0463 68.215V65.8185Z'
                                fill='url(#paint0_radial_209_2)'
                            ></path>
                            <path
                                d='M28.0463 65.8185C28.0463 64.4823 28.0463 63.8142 28.1571 63.2586C28.612 60.9771 30.3999 59.1936 32.687 58.7398C33.2439 58.6293 33.9136 58.6293 35.2531 58.6293C36.5926 58.6293 37.2623 58.6293 37.8192 58.7398C40.1063 59.1936 41.8942 60.9771 42.3491 63.2586C42.4599 63.8142 42.4599 64.4823 42.4599 65.8185V68.215C42.4599 70.0067 42.4599 70.9026 42.0737 71.57C41.8207 72.0071 41.4567 72.3701 41.0185 72.6225C40.3496 73.0078 39.4515 73.0078 37.6554 73.0078H32.8508C31.0547 73.0078 30.1566 73.0078 29.4877 72.6225C29.0494 72.3701 28.6855 72.0071 28.4325 71.57C28.0463 70.9026 28.0463 70.0067 28.0463 68.215V65.8185Z'
                                fill='#F3B4A6'
                                fillOpacity='0.06'
                            ></path>
                            <path
                                d='M17.2495 73.0078H22.1883C22.7475 73.0078 23.0271 73.0078 23.1713 72.8305C23.3155 72.6531 23.2551 72.3672 23.1343 71.7953C18.3784 49.2835 40.3702 54.3445 43.5542 38.7692C45.1793 30.8199 40.5536 20.1502 40.8267 12.7366C40.8609 11.8074 40.878 11.3428 40.6261 11.1988C40.3742 11.0548 40.0103 11.2858 39.2826 11.7479C29.0032 18.2751 21.5119 30.7526 24.2498 38.4081C24.6683 39.5784 24.8776 40.1635 24.6129 40.3772C24.3483 40.5909 23.9005 40.3154 23.0048 39.7645C21.5484 38.8687 19.8176 37.4022 18.6144 35.0915C18.2614 34.4136 18.0849 34.0747 17.8259 34.049C17.5669 34.0234 17.3444 34.2997 16.8994 34.8522C3.96515 50.9117 9.20659 66.9492 16.6769 72.8146C16.7961 72.9082 16.8557 72.955 16.9321 72.9814C17.0085 73.0078 17.0889 73.0078 17.2495 73.0078Z'
                                fill='url(#paint1_radial_209_2)'
                            ></path>
                            <path
                                d='M17.2495 73.0078H22.1883C22.7475 73.0078 23.0271 73.0078 23.1713 72.8305C23.3155 72.6531 23.2551 72.3672 23.1343 71.7953C18.3784 49.2835 40.3702 54.3445 43.5542 38.7692C45.1793 30.8199 40.5536 20.1502 40.8267 12.7366C40.8609 11.8074 40.878 11.3428 40.6261 11.1988C40.3742 11.0548 40.0103 11.2858 39.2826 11.7479C29.0032 18.2751 21.5119 30.7526 24.2498 38.4081C24.6683 39.5784 24.8776 40.1635 24.6129 40.3772C24.3483 40.5909 23.9005 40.3154 23.0048 39.7645C21.5484 38.8687 19.8176 37.4022 18.6144 35.0915C18.2614 34.4136 18.0849 34.0747 17.8259 34.049C17.5669 34.0234 17.3444 34.2997 16.8994 34.8522C3.96515 50.9117 9.20659 66.9492 16.6769 72.8146C16.7961 72.9082 16.8557 72.955 16.9321 72.9814C17.0085 73.0078 17.0889 73.0078 17.2495 73.0078Z'
                                fill='#F3B4A6'
                                fillOpacity='0.06'
                            ></path>
                            <path
                                d='M49.4691 36.4952C50.1312 43.8733 45.681 48.9199 40.598 52.4158C39.7105 53.0261 39.2668 53.3313 39.3052 53.622C39.3435 53.9127 39.8738 54.1009 40.9344 54.4775C47.7119 56.8837 48.02 63.7812 47.4588 71.9766C47.4256 72.4612 47.409 72.7035 47.5515 72.8557C47.6939 73.0078 47.936 73.0078 48.4202 73.0078H52.6539C52.7821 73.0078 52.8462 73.0078 52.9083 72.9909C52.9705 72.974 53.0256 72.9416 53.1358 72.8767C68.3125 63.9468 60.1643 42.6148 50.9054 35.5735C50.2304 35.0601 49.8929 34.8034 49.6186 34.9545C49.3443 35.1055 49.3859 35.5687 49.4691 36.4952Z'
                                fill='url(#paint2_radial_209_2)'
                            ></path>
                            <path
                                d='M49.4691 36.4952C50.1312 43.8733 45.681 48.9199 40.598 52.4158C39.7105 53.0261 39.2668 53.3313 39.3052 53.622C39.3435 53.9127 39.8738 54.1009 40.9344 54.4775C47.7119 56.8837 48.02 63.7812 47.4588 71.9766C47.4256 72.4612 47.409 72.7035 47.5515 72.8557C47.6939 73.0078 47.936 73.0078 48.4202 73.0078H52.6539C52.7821 73.0078 52.8462 73.0078 52.9083 72.9909C52.9705 72.974 53.0256 72.9416 53.1358 72.8767C68.3125 63.9468 60.1643 42.6148 50.9054 35.5735C50.2304 35.0601 49.8929 34.8034 49.6186 34.9545C49.3443 35.1055 49.3859 35.5687 49.4691 36.4952Z'
                                fill='#F3B4A6'
                                fillOpacity='0.06'
                            ></path>
                            <defs>
                                <radialGradient
                                    id='paint0_radial_209_2'
                                    cx='0'
                                    cy='0'
                                    r='1'
                                    gradientUnits='userSpaceOnUse'
                                    gradientTransform='translate(94.7049 19.4239) rotate(90) scale(67.5792 187.875)'
                                >
                                    <stop stopColor='#FF343C'></stop>
                                    <stop offset='1' stopColor='#F06F53'></stop>
                                </radialGradient>
                                <radialGradient
                                    id='paint1_radial_209_2'
                                    cx='0'
                                    cy='0'
                                    r='1'
                                    gradientUnits='userSpaceOnUse'
                                    gradientTransform='translate(94.7049 19.4239) rotate(90) scale(67.5792 187.875)'
                                >
                                    <stop stopColor='#FF343C'></stop>
                                    <stop offset='1' stopColor='#F06F53'></stop>
                                </radialGradient>
                                <radialGradient
                                    id='paint2_radial_209_2'
                                    cx='0'
                                    cy='0'
                                    r='1'
                                    gradientUnits='userSpaceOnUse'
                                    gradientTransform='translate(94.7049 19.4239) rotate(90) scale(67.5792 187.875)'
                                >
                                    <stop stopColor='#FF343C'></stop>
                                    <stop offset='1' stopColor='#F06F53'></stop>
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <h2 className='text-xl font-extrabold mb-2'>Sign in - Panel</h2>
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
                    <div css={tw`mt-6`}>
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
