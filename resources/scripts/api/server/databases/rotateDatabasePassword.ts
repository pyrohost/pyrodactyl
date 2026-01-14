import http from '@/api/http';
import { ServerDatabase, rawDataToServerDatabase } from '@/api/server/databases/getServerDatabases';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, database: string): Promise<ServerDatabase> => {
    const daemonType = getGlobalDaemonType();
    return new Promise((resolve, reject) => {
        http.post(`/api/client/${daemonType}/servers/${uuid}/databases/${database}/rotate-password`)
            .then((response) => resolve(rawDataToServerDatabase(response.data.attributes)))
            .catch(reject);
    });
};
