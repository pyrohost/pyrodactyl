import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

interface RestoreBackupResponse {
    job_id: string;
    status: string;
    message: string;
}

export const restoreServerBackup = async (
    uuid: string,
    backup: string,
): Promise<{ jobId: string; status: string; message: string }> => {
    const daemonType = getGlobalDaemonType();
    const response = await http.post<RestoreBackupResponse>(
        `/api/client/servers/${daemonType}/${uuid}/backups/${backup}/restore`,
        {
            adapter: 'rustic_s3',
            truncate_directory: true,
            download_url: '',
        },
    );

    return {
        jobId: response.data.job_id,
        status: response.data.status,
        message: response.data.message,
    };
};

export { default as createServerBackup } from './createServerBackup';
export { default as deleteServerBackup } from './deleteServerBackup';
export { default as getServerBackupDownloadUrl } from './getServerBackupDownloadUrl';
export { default as renameServerBackup } from './renameServerBackup';
export { default as retryBackup } from './retryBackup';
export type { BackupJobStatus } from './getBackupStatus';
