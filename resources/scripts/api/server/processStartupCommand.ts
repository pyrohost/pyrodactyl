import http from '@/api/http';

export default (uuid: string, command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/startup/command/process`, { command })
            .then(({ data }) => resolve(data.processed_command))
            .catch(reject);
    });
};
