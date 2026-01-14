import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';
import { ServerEggVariable } from '@/api/server/types';
import { rawDataToServerEggVariable } from '@/api/transformers';

export default async (uuid: string, key: string, value: string): Promise<[ServerEggVariable, string]> => {
    const { data } = await http.put(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/startup/variable`, {
        key,
        value,
    });

    return [rawDataToServerEggVariable(data), data.meta.startup_command];
};
