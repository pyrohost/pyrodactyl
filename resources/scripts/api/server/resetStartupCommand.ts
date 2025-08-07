import http from '@/api/http';

export default async (uuid: string): Promise<string> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/startup/command/default`);

    return data.default_startup_command;
};
