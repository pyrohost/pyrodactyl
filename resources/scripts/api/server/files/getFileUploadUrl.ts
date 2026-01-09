import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/upload`)
            .then(({ data }) => resolve(data.attributes.url))
            .catch(reject);
    });
};
