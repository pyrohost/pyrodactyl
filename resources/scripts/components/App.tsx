import { createInertiaApp } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';

import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';
import '../../css/app.css';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'


const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

console.log("!! PASTEL BETA, DEBUG LOGS WILL BE PRESENT HERE. DO NOT SHARE THIS INFORMATION WITH ANYONE !!")

const App = ({ Component, pageProps }) => {
    useEffect(() => {
        

        
    }, [pageProps]);

    return (
        <>
            <Toaster />
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

        root.render(
            <>
                <Toaster  />
                <SonnerToaster position="bottom-righ" expand={true} closebutton richColors />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});