import axios from 'axios';

export default async (uuid: string, eggid: number, nestid: number): Promise<void> => {
    await axios.put(`/api/client/servers/${uuid}/settings/egg`, {
        egg_id: eggid,
        nest_id: nestid,
    });

    const { data } = await axios.get(`/api/client/servers/${uuid}/startup`);
    const docker_images = data.meta.docker_images || {};
    const image = Object.values(docker_images)[0] as string;

    await axios.put(`/api/client/servers/${uuid}/settings/docker-image`, {
        docker_image: image,
    });
};
