import http from '@/api/http';

export default async (uuid: string, backup: string): Promise<string> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/backups/${backup}/download`);
    return data.attributes.url;
};
