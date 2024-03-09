import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import Code from '../elements/Code';

export default () => {
    const { state } = useLocation();

    return (
        <PageContentBlock title={'Your Settings'}>
            <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>Your Settings</h1>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <div className='flex flex-col w-full h-full gap-8'>
                <ContentBox title={'Update Password'} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox title={'Update Email Address'} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <ContentBox title={'Two-Step Verification'}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
                <ContentBox title={'Panel Version'}>
                    <p className='text-sm mb-4'>
                        This is useful to provide Pyro staff if you run into an unexpected issue.
                    </p>
                    <div className='flex flex-col gap-4'>
                        <Code>{import.meta.env.VITE_PYRODACTYL_VERSION}</Code>
                        <Code>Commit {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}</Code>
                    </div>
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
