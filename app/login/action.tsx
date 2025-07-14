'use server';

import { User, verify } from '@/database';
import { encrypt } from '@/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Op } from 'sequelize';

export interface LoginValues {
	type: 'idle' | 'error';
	title: string;
	message: string;
}

export const doLogin = async (
	_previous: LoginValues,
	formData: FormData,
): Promise<LoginValues> => {
	const usernameOrEmail = formData.get('user')?.toString() || '';
	const password = formData.get('password')?.toString() || '';
	if (!usernameOrEmail || !password) {
		return {
			type: 'error',
			title: 'Login Failed',
			message: 'Username and password are required.',
		};
	}

	try {
		const user = await User.findOne({
			where: {
				[Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
			},
		});
		if (!user) {
			throw new Error('User not found');
		}

		const isValidPassword = verify(password, user.password);
		if (!isValidPassword) {
			throw new Error('Invalid password');
		}

		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		const payload = await encrypt({
			userId: user.uuid,
			expiresAt,
		});

		const cookieStore = await cookies();
		cookieStore.set('session', payload, {
			httpOnly: true,
			secure: true,
			expires: expiresAt,
			sameSite: 'lax',
		});
	} catch (error) {
		console.error('Login Error:', error);
		return {
			type: 'error',
			title: 'Login Failed',
			message:
				error instanceof Error
					? error.message
					: 'An unexpected error occurred.',
		};
	}

	redirect('/dashboard');
};
