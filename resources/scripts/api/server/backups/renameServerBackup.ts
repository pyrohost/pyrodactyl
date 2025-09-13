import http from '@/api/http';
import { ServerBackup } from '@/api/server/types';
import { rawDataToServerBackup } from '@/api/transformers';

export default async (uuid: string, backup: string, name: string): Promise<ServerBackup> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/backups/${backup}/rename`, {
        name: name,
    });

    return rawDataToServerBackup(data);
};
