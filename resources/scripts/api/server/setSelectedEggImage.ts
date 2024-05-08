import http from '@/api/http';

export default async (uuid: string, eggid: number, nestid: number): Promise<void> => {
    await http.put(`/api/client/servers/${uuid}/settings/egg`, { egg_id: eggid, nest_id: nestid });
};
