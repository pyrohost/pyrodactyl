import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface ServerDatabase {
    id: string;
    name: string;
    username: string;
    connectionString: string;
    allowConnectionsFrom: string;
    password?: string;
}

export const rawDataToServerDatabase = (data: any): ServerDatabase => ({
    id: data.id,
    name: data.name,
    username: data.username,
    connectionString: `${data.host.address}:${data.host.port}`,
    allowConnectionsFrom: data.connections_from,
    password: data.relationships.password?.attributes?.password,
});

export default (uuid: string, includePassword = true): Promise<ServerDatabase[]> => {
    const daemonType = getGlobalDaemonType();

    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${daemonType}/${uuid}/databases`, {
            params: includePassword ? { include: 'password' } : undefined,
        })
            .then((response) =>
                resolve((response.data.data || []).map((item: any) => rawDataToServerDatabase(item.attributes))),
            )
            .catch(reject);
    });
};
