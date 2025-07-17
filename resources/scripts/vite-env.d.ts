/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly NEXT_PUBLIC_PYRODACTYL_VERSION: string;
    readonly NEXT_PUBLIC_COMMIT_HASH: string;
    readonly NEXT_PUBLIC_BRANCH_NAME: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
