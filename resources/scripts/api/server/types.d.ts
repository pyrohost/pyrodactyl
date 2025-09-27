export type ServerStatus =
    | 'installing'
    | 'install_failed'
    | 'reinstall_failed'
    | 'suspended'
    | 'restoring_backup'
    | null;

export interface ServerBackup {
    uuid: string;
    isSuccessful: boolean;
    isLocked: boolean;
    name: string;
    ignoredFiles: string;
    checksum: string;
    bytes: number;
    sizeGb: number;
    adapter: string;
    isRustic: boolean;
    snapshotId: string | null;
    createdAt: Date;
    completedAt: Date | null;
    // Async job fields
    jobId: string | null;
    jobStatus: 'pending' | 'running' | 'completed' | 'failed';
    jobProgress: number;
    jobMessage: string | null;
    jobError: string | null;
    jobStartedAt: Date | null;
    jobLastUpdatedAt: Date | null;
    canRetry: boolean;
    isInProgress: boolean;
}

export interface ServerEggVariable {
    name: string;
    description: string;
    envVariable: string;
    defaultValue: string;
    serverValue: string | null;
    isEditable: boolean;
    rules: string[];
}
