import react from '@vitejs/plugin-react-swc';
import * as child from 'child_process';
import fs from 'fs';
import laravel from 'laravel-vite-plugin';
import million from 'million/compiler';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { dirname, resolve } from 'pathe';
import { defineConfig } from 'vite';
import manifestSRI from 'vite-plugin-manifest-sri';

import packageJson from './package.json';

function getLaravelAppVersion() {
    try {
        const configPath = path.resolve(__dirname, 'config/app.php');
        const configContent = fs.readFileSync(configPath, 'utf8');

        const versionMatch = configContent.match(/'version'\s*=>\s*'(.*?)'/);

        if (versionMatch && versionMatch[1]) {
            return versionMatch[1];
        }

        // Fallback to package.json version if not found in Laravel config
        return packageJson.version;
    } catch (error) {
        console.error('Error reading Laravel config:', error);
        return packageJson.version;
    }
}

const laravelVersion = getLaravelAppVersion();

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

        // default manifest location is in .vite/manifest.json
        // laravel looks in public/build/manifest.json
        manifest: 'manifest.json',

        outDir: 'public/build',

        rollupOptions: {
            input: path.resolve('resources/scripts/index.tsx'),
            output: {
                // @ts-expect-error It won't fail lol
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // @ts-expect-error It won't fail lol
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                },
            },
        },
    },

    define: {
        'import.meta.env.VITE_PYRODACTYL_VERSION': JSON.stringify(laravelVersion),
        'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
        'import.meta.env.VITE_BRANCH_NAME': JSON.stringify(branchName),
        'import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER': JSON.stringify(packageJson.buildNumber),
        'process.env': {},
        'process.platform': null,
        'process.version': null,
        'process.versions': null,
    },

    plugins: [
        laravel('resources/scripts/index.tsx'),
        manifestSRI(),
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

    resolve: {
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
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

    server: {
        warmup: {
            clientFiles: [
                'resources/scripts/index.tsx',
                'resources/scripts/routers/DashboardRouter.tsx',
                'resources/scripts/components/dashboard/DashboardContainer.tsx',
                'resources/scripts/routers/ServerRouter.tsx',
            ],
        },
    },
});
