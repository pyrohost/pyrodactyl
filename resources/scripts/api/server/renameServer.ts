import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, name: string, description?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/settings/rename`, { name, description })
            .then(() => resolve())
            .catch(reject);
    });
};
