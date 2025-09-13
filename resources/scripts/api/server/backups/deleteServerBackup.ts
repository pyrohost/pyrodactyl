import http from '@/api/http';

export default async (uuid: string, backup: string): Promise<void> => {
    await http.delete(`/api/client/servers/${uuid}/backups/${backup}`);
};
