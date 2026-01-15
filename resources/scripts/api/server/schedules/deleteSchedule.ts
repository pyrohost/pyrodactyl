import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, schedule: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/schedules/${schedule}`)
            .then(() => resolve())
            .catch(reject);
    });
};
