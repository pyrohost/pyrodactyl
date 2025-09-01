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
            <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>Tu cuenta</h1>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Tu cuenta debe tener la autenticación de dos factores habilitada para continuar.
                </MessageBox>
            )}

            <div className='flex flex-col w-full h-full gap-4'>
                <h2 className='mt-8 font-extrabold text-2xl'>Información de tu cuenta</h2>
                <ContentBox title={'Dirección de correo electrónico'} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <h2 className='mt-8 font-extrabold text-2xl'>Contraseña y autenticación</h2>
                <ContentBox title={'Contraseña'} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox title={'Autenticación de dos factores'}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
                <h2 className='mt-8 font-extrabold text-2xl'>Aplicación</h2>
                <ContentBox title={'Panel Version'}>
                    <p className='text-sm mb-4'>
                        Esta información es útil a la hora de resolver problemas.
                    </p>
                    <div className='flex flex-col gap-4'>
                        <Code>
                            Versión: {import.meta.env.VITE_PYRODACTYL_VERSION} - {import.meta.env.VITE_BRANCH_NAME}
                        </Code>
                        <Code>Commit : {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}</Code>
                    </div>
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
