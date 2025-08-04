import { zodResolver } from '@hookform/resolvers/zod';
import { useStoreState } from 'easy-peasy';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Captcha, { CaptchaRef } from '@/components/Captcha';
import LoginFormContainer, { ReturnToLogin, TitleSection } from '@/components/auth/LoginFormContainer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';

import useFlash from '@/plugins/useFlash';

import FlashStatusContainer from './StatusContainer';

const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email address.').min(1, 'Email is required.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordData extends Record<string, string> {
    email: string;
}

const ForgotPasswordContainer = () => {
    const captchaRef = useRef<CaptchaRef>(null);

    const [submitted, submit] = useState(false);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);

    const { clearFlashes, addFlash } = useFlash();
    const settings = useStoreState((state) => state.settings.data);
    const captcha = settings?.captcha;

    const isCaptchaRequired = captcha?.driver !== 'none';
    const isCaptchaInvalid = isCaptchaRequired && !isCaptchaValid;

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            email: '',
        },
    });

    useEffect(() => {
        clearFlashes();
    }, [clearFlashes]);

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
        addFlash({ type: 'error', title: 'CAPTCHA Error', message: `${provider} challenge failed.` });
    };

    const handleCaptchaExpire = () => {
        setIsCaptchaValid(false);
    };

    const onSubmit = (values: ForgotPasswordFormValues) => {
        clearFlashes();

        if (isCaptchaInvalid) {
            addFlash({ type: 'error', title: 'Error', message: 'Please complete the CAPTCHA challenge.' });
            return;
        }

        const requestData: ForgotPasswordData = {
            email: values.email,
            ...captchaRef.current?.getFormData(),
        };

        http.post('/auth/password', requestData)
            .then((response) => {
                submit(true);
                addFlash({ type: 'success', title: 'Success', message: response.data.status || 'Email sent!' });
            })
            .catch((error) => {
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
                setIsCaptchaValid(false);
                resetCaptcha();
            });
    };

    return (
        <LoginFormContainer onSubmit={form.handleSubmit(onSubmit)}>
            <TitleSection
                title='Reset Password'
                subtitle="We'll send you an email with a link to reset your password."
            />
            <Form {...form}>
                <div className='flex flex-col gap-6'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        type='email'
                                        onChange={(e) => {
                                            field.onChange(e);
                                            if (submitted) {
                                                clearFlashes();
                                                submit(false);
                                            }
                                        }}
                                    />
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
                            disabled={
                                form.formState.isSubmitting || !form.formState.isValid || submitted || isCaptchaInvalid
                            }
                        >
                            Send Email
                        </Button>

                        <ReturnToLogin />
                    </div>
                </div>
            </Form>
        </LoginFormContainer>
    );
};

export default ForgotPasswordContainer;
