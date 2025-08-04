import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

import LoginFormContainer, { ReturnToLogin, TitleSection } from '@/components/auth/LoginFormContainer';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import performPasswordReset from '@/api/auth/performPasswordReset';

import useFlash from '@/plugins/useFlash';

import FlashStatusContainer from './StatusContainer';

const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Your new password should be at least 8 characters in length.')
            .min(1, 'A new password is required.'),
        passwordConfirmation: z.string().min(1, 'Your new password does not match.'),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: 'Your new password does not match.',
        path: ['passwordConfirmation'],
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContainer() {
    const [email, setEmail] = useState('Unknown');
    const { clearAndAddHttpError } = useFlash();
    const params = useParams<'token'>();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            password: '',
            passwordConfirmation: '',
        },
    });

    // Get email from URL params
    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const onSubmit = (values: ResetPasswordFormValues) => {
        const { password, passwordConfirmation } = values;

        performPasswordReset(email, {
            token: params.token ?? '',
            password,
            passwordConfirmation,
        })
            .then(() => {
                window.location.href = '/';
            })
            .catch((error) => {
                clearAndAddHttpError({ error });
            });
    };

    return (
        <div className='w-full text-sm'>
            <LoginFormContainer onSubmit={form.handleSubmit(onSubmit)}>
                <TitleSection title='Reset Password' subtitle='Enter your new password below.' />

                <Form {...form}>
                    <div className='flex flex-col gap-6'>
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <Input value={email} disabled />
                        </FormItem>

                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type='password'
                                            disabled={form.formState.isSubmitting}
                                            placeholder='Enter your new password'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='passwordConfirmation'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type='password'
                                            disabled={form.formState.isSubmitting}
                                            placeholder='Confirm your new password'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FlashStatusContainer />
                        <div className='flex items-center justify-between'>
                            <Button
                                type='submit'
                                shape='round'
                                disabled={form.formState.isSubmitting || !form.formState.isValid}
                            >
                                Reset Password
                            </Button>
                            <ReturnToLogin />
                        </div>
                    </div>
                </Form>
            </LoginFormContainer>
        </div>
    );
}

export default ResetPasswordContainer;
