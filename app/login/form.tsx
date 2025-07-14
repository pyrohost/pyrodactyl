'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

import FlashMessageRender from '@/components/FlashMessageRender';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import Logo from '@/components/elements/PyroLogo';

import { useStateContext } from '@/state';

import { type LoginValues, doLogin } from './action';

export default function LoginForm() {
	const state = useStateContext();

	const [actionState, formAction, isSubmitting] = useActionState(doLogin, {
		type: 'idle',
		title: '',
		message: '',
	} as LoginValues);

	useEffect(() => {
		if (actionState.type === 'error') {
			toast.error(actionState.message, {});
		}
	}, [state, actionState]);

	return (
		<>
			<FlashMessageRender />
			<form action={formAction} className='w-full flex' noValidate>
				<div className={`flex w-full flex-1 flex-col`}>
					<div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
					<h2 className='text-xl font-extrabold mb-2'>Login</h2>
					<Field
						id='user'
						type={'text'}
						label={'Username or Email'}
						name={'user'}
						disabled={isSubmitting}
					/>
					<div className={`relative mt-6`}>
						<Field
							id='password'
							type={'password'}
							label={'Password'}
							name={'password'}
							disabled={isSubmitting}
						/>
						<Link
							href={'/forgot-password'}
							className={`text-xs text-zinc-500 tracking-wide no-underline hover:text-zinc-600 absolute top-1 right-0`}
						>
							Forgot Password?
						</Link>
					</div>

					<div className={`mt-6`}>
						<Button
							className={`relative mt-4 w-full rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 hover:cursor-pointer`}
							type={'submit'}
							size={'xlarge'}
							isLoading={isSubmitting}
							disabled={isSubmitting}
						>
							Login
						</Button>
					</div>
				</div>
			</form>
		</>
	);
}
