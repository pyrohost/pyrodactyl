import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (server: string, schedule: number): Promise<void> =>
    await http.post(`/api/client/servers/${getGlobalDaemonType()}/${server}/schedules/${schedule}/execute`);
