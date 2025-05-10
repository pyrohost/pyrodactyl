import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdateLanguageForm from '@/components/dashboard/forms/UpdateLanguageForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

import Code from '../elements/Code';

export default () => {
    const { t } = useTranslation();
    const { state } = useLocation();

    return (
        <PageContentBlock title={t('settings.your_settings')}>
            <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>
                {t('settings.your_settings')}
            </h1>
            {state?.twoFactorRedirect && (
                <MessageBox title={t('settings.two_factor_required')} type={'error'}>
                    {t('settings.two_factor_error')}
                </MessageBox>
            )}

            <div className='flex flex-col w-full h-full gap-4'>
                <h2 className='mt-8 font-extrabold text-2xl'>{t('settings.account_info')}</h2>
                <ContentBox title={t('settings.email_address')} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <h2 className='mt-8 font-extrabold text-2xl'>{t('settings.password_auth')}</h2>
                <ContentBox title={t('settings.account_password')} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox title={t('settings.language')}>
                    <UpdateLanguageForm />
                </ContentBox>
                <ContentBox title={t('settings.multi_factor_auth')}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
                <h2 className='mt-8 font-extrabold text-2xl'>{t('settings.app')}</h2>
                <ContentBox title={t('settings.panel_version')}>
                    <p className='text-sm mb-4'>{t('settings.panel_version_desc')}</p>
                    <div className='flex flex-col gap-4'>
                        <Code>{import.meta.env.VITE_PYRODACTYL_VERSION}</Code>
                        <Code>
                            {t('build')} {import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER}, {t('commit')}{' '}
                            {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}
                        </Code>
                    </div>
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
