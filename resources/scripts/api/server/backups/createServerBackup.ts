import http from '@/api/http';
import { ServerBackup } from '@/api/server/types';
import { rawDataToServerBackup } from '@/api/transformers';

interface RequestParameters {
    name?: string;
    ignored?: string;
    isLocked: boolean;
}

interface CreateBackupResponse {
    data: any;
    meta: {
        job_id: string;
        status: string;
        progress: number;
        message?: string;
    };
}

export default async (uuid: string, params: RequestParameters): Promise<{ backup: ServerBackup; jobId: string; status: string; progress: number; message?: string }> => {
    const response = await http.post<CreateBackupResponse>(`/api/client/servers/${uuid}/backups`, {
        name: params.name,
        ignored: params.ignored,
        is_locked: params.isLocked,
    });

    return {
        backup: rawDataToServerBackup(response.data.data),
        jobId: response.data.meta.job_id,
        status: response.data.meta.status,
        progress: response.data.meta.progress,
        message: response.data.meta.message,
    };
};
