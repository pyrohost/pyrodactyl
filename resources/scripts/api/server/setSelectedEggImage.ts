import http from '@/api/http';

export default async (uuid: string, id: string): Promise<void> => {
    await http.put(`/api/client/servers/${uuid}/settings/egg`, { egg_id: id });
};
