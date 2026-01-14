import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, startup: string): Promise<string> => {
    const { data } = await http.put(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/startup/command`, {
        startup,
    });

    return data.meta.startup_command;
};
