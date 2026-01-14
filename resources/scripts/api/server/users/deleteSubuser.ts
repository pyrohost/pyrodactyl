import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/users/${userId}`)
            .then(() => resolve())
            .catch(reject);
    });
};
