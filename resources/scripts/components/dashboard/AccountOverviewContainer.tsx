import { useLocation } from 'react-router-dom';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import Code from '../elements/Code';

const AccountOverviewContainer = () => {
    const { state } = useLocation();

    return (
        <PageContentBlock title={'Ajustes'}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                {state?.twoFactorRedirect && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '25ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <MessageBox title={'Autenticación 2-FA requerida'} type={'error'}>
                            Tu cuenta debe tener la autenticación de dos factores habilitada para continuar.
                        </MessageBox>
                    </div>
                )}

                <div className='flex flex-col w-full h-full gap-4'>
                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '50ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ContentBox title={'Dirección de correo electrónico'} showFlashes={'account:email'}>
                            <UpdateEmailAddressForm />
                        </ContentBox>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '75ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='space-y-4'>
                            <ContentBox title={'Contraseña'} showFlashes={'account:password'}>
                                <UpdatePasswordForm />
                            </ContentBox>
                            <ContentBox title={'Autenticación de dos factores'}>
                                <ConfigureTwoFactorForm />
                            </ContentBox>
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '100ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ContentBox title={'Versión del panel'}>
                            <p className='text-sm mb-4 text-zinc-300'>
                                Esta información es útil a la hora de diagnosticar problemas.
                            </p>
                            <div className='flex flex-col gap-4'>
                                <Code>
                                    Versión: {import.meta.env.VITE_PYRODACTYL_VERSION} -{' '}
                                    {import.meta.env.VITE_BRANCH_NAME}
                                </Code>
                                <Code>Commit : {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}</Code>
                            </div>
                        </ContentBox>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
