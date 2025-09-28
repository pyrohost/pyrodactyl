import http from '@/api/http';

export interface BackupJobStatus {
    job_id: string | null;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    message?: string;
    error?: string;
    is_successful: boolean;
    can_cancel: boolean;
    can_retry: boolean;
    started_at?: string;
    last_updated_at?: string;
    completed_at?: string;
}

export default async (uuid: string, backupUuid: string): Promise<BackupJobStatus> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/backups/${backupUuid}/status`);

    return data;
};