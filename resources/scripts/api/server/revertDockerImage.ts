import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string): Promise<void> => {
    await http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/settings/docker-image/revert`, {
        confirm: true,
    });
};
