import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from "@vitejs/plugin-react-swc";
import path from 'path';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
    server: {
        host: "::1", // Bind to IPv6
        port: 5173,
        strictPort: true,
    }, 
    // comment the above server when working on local development 
    plugins: [
        laravel({
            input: 'resources/scripts/components/App.tsx',
            refresh: true,
            https: true
        }),
        react(),
        mkcert() 
    ],
    resolve: {
        alias: {
            'ziggy-js': path.resolve('vendor/tightenco/ziggy'),
            '@': path.resolve(__dirname, 'resources/scripts'),
        },
    },

    esbuild: {
        drop: ['console', 'debugger'],
      },
});