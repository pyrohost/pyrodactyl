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
        <PageContentBlock title={'Your Settings'}>
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
                        <MessageBox title={'2-Factor Required'} type={'error'}>
                            Your account must have two-factor authentication enabled in order to continue.
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
                        <ContentBox title={'Account Email'} showFlashes={'account:email'}>
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
                            <ContentBox title={'Account Password'} showFlashes={'account:password'}>
                                <UpdatePasswordForm />
                            </ContentBox>
                            <ContentBox title={'Multi-Factor Authentication'}>
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
                        <ContentBox title={'Panel Version'}>
                            <p className='text-sm mb-4 text-zinc-300'>
                                This is useful to provide Pyro staff if you run into an unexpected issue.
                            </p>
                            <div className='flex flex-col gap-4'>
                                <Code>
                                    Version: {import.meta.env.VITE_PYRODACTYL_VERSION} -{' '}
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
