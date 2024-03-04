// Because of how react-router, react lazy, and signals work with each other
// the only way to prevent mismatching and weird errors is to import the lib
// in the root first. The github issue for this is still open. Stupid.
// https://github.com/preactjs/signals/issues/414
import '@preact/signals-react';

import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import { SiteSettings } from '@/state/settings';
import { NotFound } from '@/components/elements/ScreenBlock';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import { ServerContext } from '@/state/server';
import '@/assets/tailwind.css';
import Spinner from '@/components/elements/Spinner';

const DashboardRouter = lazy(() => import('@/routers/DashboardRouter'));
const ServerRouter = lazy(() => import('@/routers/ServerRouter'));
const AuthenticationRouter = lazy(() => import('@/routers/AuthenticationRouter'));

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    PterodactylUser?: {
        uuid: string;
        username: string;
        email: string;
        /* eslint-disable camelcase */
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
        /* eslint-enable camelcase */
    };
}

const App = () => {
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
                <div
                    data-pyro-routerwrap=''
                    className='relative w-full h-full flex flex-row p-2 overflow-hidden rounded-lg'
                >
                    <BrowserRouter>
                        <Routes>
                            <Route
                                path='/auth/*'
                                element={
                                    <Spinner.Suspense>
                                        <AuthenticationRouter />
                                    </Spinner.Suspense>
                                }
                            />

                            <Route
                                path='/server/:id/*'
                                element={
                                    <AuthenticatedRoute>
                                        <Spinner.Suspense>
                                            <ServerRouter />
                                        </Spinner.Suspense>
                                    </AuthenticatedRoute>
                                }
                            />

                            <Route
                                path='/*'
                                element={
                                    <AuthenticatedRoute>
                                        <Spinner.Suspense>
                                            <DashboardRouter />
                                        </Spinner.Suspense>
                                    </AuthenticatedRoute>
                                }
                            />

                            <Route path='*' element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </div>
            </StoreProvider>
        </>
    );
};

export default App;
