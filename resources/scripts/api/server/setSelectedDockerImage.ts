import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, image: string): Promise<void> => {
    await http.put(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/settings/docker-image`, {
        docker_image: image,
    });
};
