import { verifySession } from '@/dai';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
	const { isAuth, userId } = await verifySession();

	if (!isAuth) {
		redirect('/login');
	}

	return (
		<div className='w-full max-w-lg px-8'>
			<h2 className={`text-3xl text-center text-zinc-100 font-medium py-4`}>
				Welcome to Pyrodactyl
			</h2>
		</div>
	);
}
