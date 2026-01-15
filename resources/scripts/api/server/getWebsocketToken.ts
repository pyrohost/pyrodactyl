import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

interface Response {
    token: string;
    socket: string;
}

export default (server: string): Promise<Response> => {
    const daemonType = getGlobalDaemonType();

    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${daemonType}/${server}/websocket`)
            .then(({ data }) =>
                resolve({
                    token: data.data.token,
                    socket: data.data.socket,
                }),
            )
            .catch(reject);
    });
};
