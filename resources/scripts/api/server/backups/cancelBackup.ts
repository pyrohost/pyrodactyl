import http from '@/api/http';

export interface CancelBackupResponse {
    message: string;
    status: string;
}

export default async (uuid: string, backupUuid: string): Promise<CancelBackupResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/backups/${backupUuid}/cancel`);

    return data;
};