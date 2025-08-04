import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import LoginFormContainer, { ReturnToLogin, TitleSection } from '@/components/auth/LoginFormContainer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import loginCheckpoint from '@/api/auth/loginCheckpoint';

import useFlash from '@/plugins/useFlash';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../ui/input-otp';
import FlashStatusContainer from './StatusContainer';

interface CheckpointFormValues {
    code?: string;
    recoveryCode?: string;
}

function LoginCheckpointContainer() {
    const [isMissingDevice, setIsMissingDevice] = useState(false);
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const location = useLocation();
    const navigate = useNavigate();

    const form = useForm<CheckpointFormValues>({
        defaultValues: {
            code: '',
            recoveryCode: '',
        },
    });

    // Redirect if no token is present
    if (!location.state?.token) {
        navigate('/auth/login');
        return null;
    }

    const onSubmit = (values: CheckpointFormValues) => {
        const { code, recoveryCode } = values;

        loginCheckpoint(location.state?.token || '', code || '', recoveryCode || '')
            .then((response) => {
                if (response.complete) {
                    window.location.href = response.intended || '/';
                    return;
                }
            })
            .catch((error) => {
                clearAndAddHttpError({ error });
            });
    };

    const handleDeviceToggle = () => {
        clearFlashes();
        form.setValue('code', '');
        form.setValue('recoveryCode', '');
        setIsMissingDevice((prev) => !prev);
    };

    return (
        <LoginFormContainer onSubmit={form.handleSubmit(onSubmit)}>
            <TitleSection
                title='Two Factor Authentication'
                subtitle={
                    isMissingDevice
                        ? 'Enter one of the recovery codes generated when you setup two-factor auth on this account.'
                        : 'Enter the two-factor token displayed by your device.'
                }
            />
            <Form {...form}>
                <div className='flex flex-col gap-6'>
                    <FormField
                        control={form.control}
                        name={isMissingDevice ? 'recoveryCode' : 'code'}
                        render={({ field }) => (
                            <FormItem className='max-w-fit'>
                                <FormLabel>{isMissingDevice ? 'Recovery Code' : 'Authentication Code'}</FormLabel>
                                <FormControl>
                                    {isMissingDevice ? (
                                        <InputOTP
                                            {...field}
                                            maxLength={10}
                                            autoFocus
                                            disabled={form.formState.isSubmitting}
                                            className='text-secondary focus-visible:ring-0'
                                            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                            onComplete={() => {
                                                form.handleSubmit(onSubmit)();
                                            }}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={5} />
                                                <InputOTPSlot index={6} />
                                                <InputOTPSlot index={7} />
                                                <InputOTPSlot index={8} />
                                                <InputOTPSlot index={9} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    ) : (
                                        <InputOTP
                                            {...field}
                                            maxLength={6}
                                            autoFocus
                                            disabled={form.formState.isSubmitting}
                                            className='text-secondary focus-visible:ring-0'
                                            pattern={REGEXP_ONLY_DIGITS}
                                            onComplete={() => {
                                                form.handleSubmit(onSubmit)();
                                            }}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FlashStatusContainer />

                    <div className='flex w-full gap-8 items-center'>
                        <Button type='button' shape='round' onClick={handleDeviceToggle}>
                            {!isMissingDevice ? "I've Lost My Device" : 'I Have My Device'}
                        </Button>

                        <ReturnToLogin />
                    </div>
                </div>
            </Form>
        </LoginFormContainer>
    );
}

export default LoginCheckpointContainer;
