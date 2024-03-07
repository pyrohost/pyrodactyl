import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import { dirname, resolve } from 'pathe';
import { fileURLToPath } from 'node:url';
import manifestSRI from 'vite-plugin-manifest-sri';
import { splitVendorChunkPlugin } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
        emptyOutDir: true,
        // we need to do this because otherwise it will
        // generate in .vite/manifest.json, while laravel
        // looks in public/build/manifest.json
        manifest: 'manifest.json',
        outDir: 'public/build',

        rollupOptions: {
            input: 'resources/scripts/index.tsx',
            output: {
                // @ts-ignore
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // @ts-expect-error
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                },
            },
        },
    },

    define: {
        'process.env': {},
        'process.platform': null,
        'process.version': null,
        'process.versions': null,
    },

    plugins: [
        laravel('resources/scripts/index.tsx'),
        manifestSRI(),
        splitVendorChunkPlugin(),
        react({ plugins: [['@swc/plugin-styled-components', {}]] }),
    ],

    resolve: {
        alias: {
            '@': resolve(dirname(fileURLToPath(import.meta.url)), 'resources', 'scripts'),
            '@definitions': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'api',
                'definitions'
            ),
            '@feature': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'components',
                'server',
                'features'
            ),
        },
    },
});
