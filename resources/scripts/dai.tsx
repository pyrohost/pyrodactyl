import { decrypt } from '@/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';

export const verifySession = cache(async () => {
    try {
        const cookie = (await cookies()).get('session')?.value;
        const session = await decrypt(cookie);

        if (!session?.userId) {
            redirect('/login');
        }
        return { isAuth: true, userId: session.userId };
    } catch (error) {
        console.error('Session verification failed:', error);
        return { isAuth: false, userId: null };
    }
});
