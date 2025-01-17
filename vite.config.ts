import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from "@vitejs/plugin-react-swc";
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/scripts/components/App.tsx',
            refresh: true,
        }),
        react(),
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