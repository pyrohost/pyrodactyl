import type { ActionCreator } from 'easy-peasy';
import { useFormikContext, withFormik } from 'formik';
import { useState } from 'react';
import type { Location, RouteProps } from 'react-router-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';

import loginCheckpoint from '@/api/auth/loginCheckpoint';

import type { FlashStore } from '@/state/flashes';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    code: string;
    recoveryCode: '';
}

type OwnProps = RouteProps;

type Props = OwnProps & {
    clearAndAddHttpError: ActionCreator<FlashStore['clearAndAddHttpError']['payload']>;
};

function LoginCheckpointContainer() {
    const { isSubmitting, setFieldValue } = useFormikContext<Values>();
    const [isMissingDevice, setIsMissingDevice] = useState(false);

    return (
        <ContentBox className='p-12 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-xs rounded-xl'>
            <LoginFormContainer className={`w-full flex`}>
                <Link to='/'>
                    <div className='flex h-12 mb-4 items-center w-full'>
                        <Logo />
                    </div>
                </Link>
                <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                <h2 className='text-xl font-extrabold mb-2'>Two Factor Authentication</h2>
                <div className='text-sm mb-6'>Check device linked with your account for code.</div>

                <div className={`mt-6`}>
                    <Field
                        name={isMissingDevice ? 'recoveryCode' : 'code'}
                        title={isMissingDevice ? 'Recovery Code' : 'Authentication Code'}
                        placeholder='000000'
                        description={
                            isMissingDevice
                                ? 'Enter one of the recovery codes generated when you setup 2-Factor authentication on this account in order to continue.'
                                : 'Enter the two-factor token displayed by your device.'
                        }
                        type={'text'}
                        autoComplete={'one-time-code'}
                        autoFocus
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
                        Login
                    </Button>
                </div>
                <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>

                <div
                    className={`mt-6 text-center w-full rounded-t-lg border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 mb-2 hover:cursor-pointer `}
                >
                    <span
                        onClick={() => {
                            setFieldValue('code', '');
                            setFieldValue('recoveryCode', '');
                            setIsMissingDevice((s) => !s);
                        }}
                        // className={`cursor-pointer text-xs text-white tracking-wide uppercase no-underline hover:text-neutral-700`}
                        className={
                            'block w-full text-center py-2.5 px-4 text-xs font-medium tracking-wide uppercase text-white hover:text-white/80 transition-colors duration-200 border border-white/20 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
                        }
                    >
                        {!isMissingDevice ? "I've Lost My Device" : 'I Have My Device'}
                    </span>
                </div>
                <div
                    className={`text-center w-full rounded-b-lg  border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 hover:cursor-pointer `}
                >
                    <Link
                        to={'/auth/login'}
                        className={
                            'block w-full text-center py-2.5 px-4 text-xs font-medium tracking-wide uppercase text-white hover:text-white/80 transition-colors duration-200 border border-white/20 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
                        }
                    >
                        Return to Login
                    </Link>
                </div>
            </LoginFormContainer>
        </ContentBox>
    );
}

const EnhancedForm = withFormik<Props & { location: Location }, Values>({
    handleSubmit: ({ code, recoveryCode }, { setSubmitting, props: { clearAndAddHttpError, location } }) => {
        loginCheckpoint(location.state?.token || '', code, recoveryCode)
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                setSubmitting(false);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    },

    mapPropsToValues: () => ({
        code: '',
        recoveryCode: '',
    }),
})(LoginCheckpointContainer);

export default ({ ...props }: OwnProps) => {
    const { clearAndAddHttpError } = useFlash();

    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state?.token) {
        navigate('/auth/login');

        return null;
    }

    return <EnhancedForm clearAndAddHttpError={clearAndAddHttpError} location={location} {...props} />;
};
