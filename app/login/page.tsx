import Logo from '@/components/elements/PyroLogo';

import LoginForm from './form';

export default function Login() {
	return (
		<div className='w-full max-w-lg px-8 grid place-items-center'>
			<div className='flex h-12 mb-4 items-center w-full'>
				<Logo />
			</div>
			<LoginForm />
		</div>
	);
}
