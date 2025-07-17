import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import '@/assets/tailwind.css';
import { Providers } from '@/providers';
import '@preact/signals-react';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import PyrodactylProvider from '@/components/PyrodactylProvider';

export const metadata: Metadata = {
	title: 'Pyrodactyl',
	description:
		'Pyrodactyl is the Pterodactyl-based game server panel that is faster, smaller, safer, and more accessible than Pelican.',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				<div id='root'>
					<Providers>
						<GlobalStylesheet />
						<PyrodactylProvider>
							<div
								data-pyro-routerwrap=''
								className='w-full h-screen p-2 overflow-hidden rounded-lg flex flex-col gap-4 items-center justify-center'
								style={{
									background:
										'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(18, 18, 18) 0%, rgb(0, 0, 0) 100%)',
								}}
							>
								<Toaster
									theme='dark'
									toastOptions={{
										unstyled: true,
										classNames: {
											toast:
												'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
										},
									}}
								/>
								{children}
							</div>
						</PyrodactylProvider>
					</Providers>
				</div>
			</body>
		</html>
	);
}
