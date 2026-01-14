import http from '@/api/http';
import { Allocation } from '@/api/server/getServer';
import { rawDataToServerAllocation } from '@/api/transformers';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, id: number, notes: string | null): Promise<Allocation> => {
    const { data } = await http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/network/allocations/${id}`, { notes });

    return rawDataToServerAllocation(data);
};
