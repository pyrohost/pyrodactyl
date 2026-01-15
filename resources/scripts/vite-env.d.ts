/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PYRODACTYL_VERSION: string;
    readonly VITE_COMMIT_HASH: string;
    readonly VITE_BRANCH_NAME: string;
    readonly VITE_PYRODACTYL_BUILD_NUMBER: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
