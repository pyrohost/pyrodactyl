import { zodResolver } from '@hookform/resolvers/zod';
import { useStoreState } from 'easy-peasy';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import Captcha, { CaptchaRef } from '@/components/Captcha';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import login from '@/api/auth/login';

import useFlash from '@/plugins/useFlash';

import { Button } from '../ui/button';
import SecondaryLink from '../ui/secondary-link';
import FlashStatusContainer from './StatusContainer';

const loginSchema = z.object({
    user: z.string().min(1, 'A username or email must be provided.'),
    password: z.string().min(1, 'Please enter your account password.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginData extends Record<string, string> {
    user: string;
    password: string;
}

function LoginContainer() {
    const captchaRef = useRef<CaptchaRef>(null);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const settings = useStoreState((state) => state.settings.data);
    const captcha = settings?.captcha;

    const isCaptchaRequired = captcha?.driver !== 'none';
    const isCaptchaInvalid = isCaptchaRequired && !isCaptchaValid;

    const navigate = useNavigate();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            user: '',
            password: '',
        },
    });

    useEffect(() => {
        clearFlashes();
    }, [clearFlashes]);

    // Watch for changes in the user field to reset submitting state
    useEffect(() => {
        const subscription = form.watch((_value, { name }) => {
            if (name === 'user' && form.formState.isSubmitting) {
                form.clearErrors();
                // Reset form state to stop submitting
                form.formState.isSubmitting = false;
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // Don't render if settings aren't loaded yet
    if (!settings?.captcha) {
        return <div>Loading...</div>;
    }

    const resetCaptcha = () => {
        setIsCaptchaValid(false);
        if (captchaRef.current) {
            captchaRef.current.reset();
        }
    };

    const handleCaptchaComplete = () => {
        setIsCaptchaValid(true);
    };

    const handleCaptchaError = (provider: string) => {
        setIsCaptchaValid(false);
        clearAndAddHttpError({ error: new Error(`${provider} challenge failed.`) });
    };

    const handleCaptchaExpire = () => {
        setIsCaptchaValid(false);
    };

    const onSubmit = (values: LoginFormValues) => {
        clearFlashes();

        if (isCaptchaInvalid) {
            clearAndAddHttpError({ error: new Error('Please complete the CAPTCHA challenge.') });
            return;
        }

        const requestData: LoginData = {
            user: values.user,
            password: values.password,
            ...captchaRef.current?.getFormData(),
        };

        login(requestData)
            .then((response) => {
                if (response.complete) {
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', { state: { token: response.confirmationToken } });
            })
            .catch(
                (error: Error & { response?: { status?: number; data?: unknown }; detail?: string; code?: string }) => {
                    console.error('Login error details:', {
                        message: error.message,
                        detail: error.detail,
                        code: error.code,
                        response: error.response,
                    });

                    setIsCaptchaValid(false);
                    resetCaptcha();

                    if (error.code === 'InvalidCredentials') {
                        clearAndAddHttpError({ error: new Error('Invalid username or password. Please try again.') });
                    } else if (error.code === 'DisplayException') {
                        clearAndAddHttpError({ error: new Error(error.detail || error.message) });
                    } else {
                        clearAndAddHttpError({ error });
                    }
                },
            );
    };

    return (
        <LoginFormContainer onSubmit={form.handleSubmit(onSubmit)}>
            <TitleSection title='Login' />
            <Form {...form}>
                <div className='flex flex-col gap-6'>
                    <FormField
                        control={form.control}
                        name='user'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username or Email</FormLabel>
                                <FormControl>
                                    <Input {...field} type='text' disabled={form.formState.isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input {...field} type='password' disabled={form.formState.isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Captcha
                        ref={captchaRef}
                        onVerify={handleCaptchaComplete}
                        onError={handleCaptchaError}
                        onExpire={handleCaptchaExpire}
                    />

                    <FlashStatusContainer />
                    <div className='flex w-full justify-between items-center'>
                        <Button
                            type='submit'
                            shape='round'
                            disabled={form.formState.isSubmitting || !form.formState.isValid || isCaptchaInvalid}
                        >
                            Sign in
                        </Button>

                        <SecondaryLink to='/auth/password'>Forgot your password?</SecondaryLink>
                    </div>
                </div>
            </Form>
        </LoginFormContainer>
    );
}

export default LoginContainer;
