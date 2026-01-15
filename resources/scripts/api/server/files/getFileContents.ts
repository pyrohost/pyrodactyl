import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (server: string, file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${getGlobalDaemonType()}/${server}/files/contents`, {
            params: { file },
            transformResponse: (res) => res,
            responseType: 'text',
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
