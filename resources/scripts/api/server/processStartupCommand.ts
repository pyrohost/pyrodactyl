import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, command: string): Promise<string> => {
    const daemonType = getGlobalDaemonType();
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${daemonType}/${uuid}/startup/command/process`, { command })
            .then(({ data }) => resolve(data.processed_command))
            .catch(reject);
    });
};
