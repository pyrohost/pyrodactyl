import http from '@/api/http';
import { Allocation } from '@/api/server/getServer';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, id: number): Promise<Allocation> =>
    await http.delete(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/network/allocations/${id}`);
