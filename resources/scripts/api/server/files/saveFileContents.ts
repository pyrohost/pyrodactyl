import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, file: string, content: string): Promise<void> => {
    await http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/write`, content, {
        params: { file },
        headers: {
            'Content-Type': 'text/plain',
        },
    });
};
