import http from '@/api/http';

export default async (uuid: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/settings/docker-image/revert`, { confirm: true });
};
