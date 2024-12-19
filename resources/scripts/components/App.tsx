import { createInertiaApp } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import { FlashProvider } from '@/plugins/useFlash';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';
import '../../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const App = ({ Component, pageProps }) => {
    useEffect(() => {
        const handleNavigate = (event) => {
            if (event.detail.page.props.auth && event.detail.page.props.auth.user === null) {
                // Clear user state in your application
                pageProps.auth.user = null;
            }
        };

        Inertia.on('navigate', handleNavigate);

        return () => {
            Inertia.off('navigate', handleNavigate);
        };
    }, [pageProps]);

    return (
        <>
            <Component {...pageProps} />
        </>
    );
};

export default App;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});