import http from '@/api/http';

export interface RetryBackupResponse {
    message: string;
    job_id: string;
    status: string;
    progress: number;
}

export default async (uuid: string, backupUuid: string): Promise<RetryBackupResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/backups/${backupUuid}/retry`);

    return data;
};