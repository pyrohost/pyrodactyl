import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, scheduleId: number, taskId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/${getGlobalDaemonType()}/servers/${uuid}/schedules/${scheduleId}/tasks/${taskId}`)
            .then(() => resolve())
            .catch(reject);
    });
};
