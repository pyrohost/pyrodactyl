import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string): Promise<string> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/startup/command/default`);

    return data.default_startup_command;
};
