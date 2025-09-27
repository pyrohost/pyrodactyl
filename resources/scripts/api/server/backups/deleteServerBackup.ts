import http from '@/api/http';

interface DeleteBackupResponse {
    job_id: string;
    status: string;
    message: string;
}

export default async (uuid: string, backup: string): Promise<{ jobId: string; status: string; message: string }> => {
    const response = await http.delete<DeleteBackupResponse>(`/api/client/servers/${uuid}/backups/${backup}`);

    return {
        jobId: response.data.job_id,
        status: response.data.status,
        message: response.data.message,
    };
};
