import { useHeader } from '@/contexts/HeaderContext';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import Code from '../elements/Code';
import HeaderCentered from './header/HeaderCentered';

const AccountOverviewContainer = () => {
    const { state } = useLocation();

    const { setHeaderActions, clearHeaderActions } = useHeader();

    useEffect(() => {
        setHeaderActions(<HeaderCentered className='font-semibold'>Your Settings</HeaderCentered>);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions]);

    return (
        <PageContentBlock title={'Your Settings'}>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <div className='flex flex-col w-full gap-4'>
                <h2 className='font-extrabold text-2xl'>Account Information</h2>
                <ContentBox title={'Email Address'} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <h2 className='mt-6 font-extrabold text-2xl'>Password and Authentication</h2>
                <ContentBox title={'Account Password'} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox title={'Multi-Factor Authentication'}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
                <h2 className='mt-6 font-extrabold text-2xl'>App</h2>
                <ContentBox title={'Panel Version'}>
                    <p className='text-sm mb-4'>
                        This is useful to provide Pyro staff if you run into an unexpected issue.
                    </p>
                    <div className='flex flex-col gap-4'>
                        <Code>
                            Version: {import.meta.env.VITE_PYRODACTYL_VERSION} - {import.meta.env.VITE_BRANCH_NAME}
                        </Code>
                        <Code>Commit : {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}</Code>
                    </div>
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
