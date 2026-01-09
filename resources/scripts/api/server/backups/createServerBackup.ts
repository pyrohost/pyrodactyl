import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';
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

export default async (
    uuid: string,
    params: RequestParameters,
): Promise<{ backup: ServerBackup; jobId: string; status: string; progress: number; message?: string }> => {
    const daemonType = getGlobalDaemonType();
    const response = await http.post<CreateBackupResponse>(`/api/client/servers/${daemonType}/${uuid}/backups`, {
        name: params.name,
        ignored: params.ignored,
        is_locked: params.isLocked,
    });

    if (!response.data) {
        throw new Error('Invalid response: missing data');
    }

    if (response.data.data && response.data.meta) {
        const backupData = rawDataToServerBackup(response.data.data);

        return {
            backup: backupData,
            jobId: response.data.meta.job_id,
            status: response.data.meta.status,
            progress: response.data.meta.progress,
            message: response.data.meta.message,
        };
    }

    if (response.data.job_id && response.data.status) {
        // Create a minimal backup object for the async job
        // note: I really don't like this implementation but I really can't be fucked right now to do this better - ellie
        const tempBackup: ServerBackup = {
            uuid: '', // Will be filled when WebSocket events arrive
            name: params.name || 'Pending...',
            isSuccessful: false,
            isLocked: params.isLocked,
            checksum: '',
            bytes: 0,
            createdAt: new Date(),
            completedAt: null,
            canRetry: false,
            jobStatus: response.data.status,
            jobProgress: 0,
            jobMessage: response.data.message || '',
            jobId: response.data.job_id,
            jobError: null,
            object: 'backup',
        };

        return {
            backup: tempBackup,
            jobId: response.data.job_id,
            status: response.data.status,
            progress: 0,
            message: response.data.message || '',
        };
    }

    if (response.data.uuid || response.data.object === 'backup') {
        try {
            const backupData = rawDataToServerBackup(response.data);

            return {
                backup: backupData,
                jobId: backupData.jobId || '',
                status: backupData.jobStatus || 'pending',
                progress: backupData.jobProgress || 0,
                message: backupData.jobMessage || '',
            };
        } catch (transformError) {
            throw new Error(`Failed to process backup response: ${transformError.message}`);
        }
    }

    throw new Error('Invalid response: unknown structure');
};
