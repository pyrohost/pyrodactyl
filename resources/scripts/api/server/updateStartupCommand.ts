import http from '@/api/http';

export default async (uuid: string, startup: string): Promise<string> => {
    const { data } = await http.put(`/api/client/servers/${uuid}/startup/command`, { startup });

    return data.meta.startup_command;
};
