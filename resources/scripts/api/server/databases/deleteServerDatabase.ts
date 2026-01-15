import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, database: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/databases/${database}`)
            .then(() => resolve())
            .catch(reject);
    });
};
