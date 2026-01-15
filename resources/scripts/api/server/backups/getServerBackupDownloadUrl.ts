import http from '@/api/http';
import { getGlobalDaemonType } from '../getServer';

export default async (uuid: string, backup: string): Promise<string> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/backups/${backup}/download`);
    return data.attributes.url;
};
