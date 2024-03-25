import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';
import manifestSRI from 'vite-plugin-manifest-sri';

import million from 'million/compiler';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';

import packageJson from './package.json';
import { dirname, resolve } from 'pathe';
import { fileURLToPath } from 'node:url';
import * as child from 'child_process';

let branchName;
let commitHash;

try {
    branchName = child.execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
    commitHash = child.execSync('git rev-parse HEAD').toString().trimEnd();
} catch (error) {
    console.error('Error executing git command:', error);
    branchName = 'unknown';
    commitHash = 'unknown';
}

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
                        // It won't fail lol
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                },
            },
        },

        sourcemap: true,
    },

    // css: {
    //     preprocessorMaxWorkers: true,
    // },

    define: {
        'import.meta.env.VITE_PYRODACTYL_VERSION': JSON.stringify(packageJson.version),
        'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
        'import.meta.env.VITE_BRANCH_NAME': JSON.stringify(branchName),
        'import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER': JSON.stringify(packageJson.buildNumber),
        'process.env': {},
        'process.platform': null,
        'process.version': null,
        'process.versions': null,
    },

    // optimizeDeps: {
    //     holdUntilCrawlEnd: true,
    // },

    plugins: [
        laravel('resources/scripts/index.tsx'),
        manifestSRI(),
        splitVendorChunkPlugin(),
        [
            million.vite({
                auto: {
                    threshold: 0.01,
                },
                telemetry: false,
            }),
            react({
                plugins: [
                    [
                        '@swc/plugin-styled-components',
                        {
                            pure: true,
                            namespace: 'pyrodactyl',
                        },
                    ],
                ],
            }),
        ],
        sentryVitePlugin({
            org: 'pyrohost',
            project: 'pyrodactyl-panel',
            telemetry: false,
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(dirname(fileURLToPath(import.meta.url)), 'resources', 'scripts'),
            '@definitions': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'api',
                'definitions',
            ),
            '@feature': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'components',
                'server',
                'features',
            ),
        },
    },
});
