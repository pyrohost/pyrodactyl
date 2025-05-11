import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: [
            '**/public',
            '**/node_modules',
            'resources/views',
            '**/babel.config.js',
            '**/tailwind.config.js',
            '**/webpack.config.js',
            '**/tsconfig.json',
            '**/eslint.config.mjs',
        ],
    },
    ...compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:@typescript-eslint/recommended',
    ),
    {
        plugins: {
            react,
            'react-hooks': fixupPluginRules(reactHooks),
            prettier,
            '@typescript-eslint': typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },

            parser: tsParser,
        },

        settings: {
            react: {
                pragma: 'React',
                version: 'detect',
            },

            linkComponents: [
                {
                    name: 'Link',
                    linkAttribute: 'to',
                },
                {
                    name: 'NavLink',
                    linkAttribute: 'to',
                },
            ],
        },

        rules: {
            '@typescript-eslint/no-var-requires': 0,
            '@typescript-eslint/ban-ts-comment': 0,

            'prettier/prettier': [
                'warn',
                {
                    endOfLine: 'auto',
                },
                {
                    usePrettierrc: true,
                },
            ],

            'react/prop-types': 0,
            'react/display-name': 0,

            'react/no-unknown-property': [
                'error',
                {
                    ignore: ['css'],
                },
            ],

            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-non-null-assertion': 0,
            'no-use-before-define': 0,
            '@typescript-eslint/no-use-before-define': 'warn',

            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],

        languageOptions: {
            ecmaVersion: 6,
            sourceType: 'script',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },

                project: './tsconfig.json',
                tsconfigRootDir: './',
            },
        },
    },
];
