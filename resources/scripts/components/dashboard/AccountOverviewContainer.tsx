import { useLocation } from 'react-router-dom';
import { State, useStoreState } from 'easy-peasy';
import type { ApplicationStore } from '@/state';
import sha256 from 'crypto-js/sha256';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';

import Code from '../elements/Code';

export default () => {
    const { state } = useLocation();

    const user = useStoreState((state: State<ApplicationStore>) => state.user.data!);
    const emailHash = sha256(user.email).toString();
    const avatar = `https://www.gravatar.com/avatar/${emailHash}?s=128&d=identicon`;

    return (
        <PageContentBlock title={'Your Settings'}>
            <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>Your Settings</h1>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <ContentBox>
                <Tabs defaultValue={'email'}>
                    <div className='flex items-center gap-4 pb-6'>
                        <img src={avatar} alt='User Avatar' className='w-16 h-16 rounded-full' />
                        <div>
                            <p className='text-lg font-semibold'>{user.username}</p>
                            <p className='text-sm text-zinc-500'>{user.email}</p>
                        </div>
                    </div>
                
                    <TabsList className='mb-8'>
                        <TabsTrigger aria-label={'Email'} value={'email'} >
                            Email
                        </TabsTrigger>
                        <TabsTrigger aria-label={'Password'} value={'password'}>
                            Password
                        </TabsTrigger>
                        <TabsTrigger aria-label={'2FA'} value={'security'}>
                            2FA
                        </TabsTrigger>
                        <TabsTrigger aria-label={'App Info'} value={'app-info'}>
                            App Info
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='email'>
                        <UpdateEmailAddressForm />
                    </TabsContent>
                    <TabsContent value={'password'}>
                        <UpdatePasswordForm />
                    </TabsContent>
                    <TabsContent value={'security'}>
                        <ConfigureTwoFactorForm />
                    </TabsContent>
                    <TabsContent value={'app-info'}>
                        <p className='text-sm mb-4'>
                            This is useful to provide Pyro staff if you run into an unexpected issue.
                        </p>
                        <div className='flex flex-col gap-4'>
                            <div>
                                Version {' '}
                                <Code>{import.meta.env.VITE_PYRODACTYL_VERSION}</Code>
                            </div>
                            <div>
                                Git {' '}
                                <Code>
                                    Build {import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER}, Commit{' '}
                                    {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}
                                </Code>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </ContentBox>
        </PageContentBlock>
    );
};
