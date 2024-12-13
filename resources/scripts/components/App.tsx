import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import '@/assets/tailwind.css';
import '@preact/signals-react';
import { StoreProvider } from 'easy-peasy';
import { Toaster } from 'sonner';

import { store } from '@/state';
import { SiteSettings } from '@/state/settings';

import PyrodactylProvider from './PyrodactylProvider';

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    PterodactylUser?: {
        uuid: string;
        username: string;
        email: string;
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
    };
}

const App = ({ Component, pageProps }) => {
    const { PterodactylUser, SiteConfiguration } = window as ExtendedWindow;

    if (PterodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: PterodactylUser.uuid,
            username: PterodactylUser.username,
            email: PterodactylUser.email,
            language: PterodactylUser.language,
            rootAdmin: PterodactylUser.root_admin,
            useTotp: PterodactylUser.use_totp,
            createdAt: new Date(PterodactylUser.created_at),
            updatedAt: new Date(PterodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings(SiteConfiguration!);
    }

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <PyrodactylProvider>
                    <div data-pyro-routerwrap='' className='relative w-full h-full flex flex-row p-2 overflow-hidden rounded-lg bg-black'>
                        <Toaster
                            theme='dark'
                            toastOptions={{
                                unstyled: true,
                                classNames: {
                                    toast: 'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
                                },
                            }}
                        />
                        <Component {...pageProps} />
                    </div>
                </PyrodactylProvider>
            </StoreProvider>
        </>
    );
};

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App: InertiaApp, props }) {
        createRoot(el).render(<App {...props} />);
    },
});

export default App;