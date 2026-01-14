import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';
// NOTE: This is Specific to wings, it should also work for elytra, but I haven't actually tested

interface ApplyEggChangeData {
    egg_id: number;
    nest_id: number;
    docker_image?: string;
    startup_command?: string;
    environment?: Record<string, string>;
    should_backup?: boolean;
    should_wipe?: boolean;
}

export default async (uuid: string, data: ApplyEggChangeData): Promise<void> => {
    const daemonType = getGlobalDaemonType();

    if (daemonType?.toLowerCase() === 'elytra') {
        return http.post(`/api/client/servers/${daemonType}/${uuid}/settings/egg/apply`, data);
    }

    if (daemonType?.toLowerCase() === 'wings') {
        const {
            egg_id,
            nest_id,
            docker_image,
            startup_command,
            environment = {},
            should_backup = false,
            should_wipe = false,
        } = data;

        try {
            await http.put(`/api/client/servers/${daemonType}/${uuid}/settings/egg`, {
                egg_id,
                nest_id,
            });

            if (docker_image) {
                await http.put(`/api/client/servers/${daemonType}/${uuid}/settings/docker-image`, {
                    docker_image,
                });
            }

            if (startup_command) {
                console.warn('Custom startup command update not supported for Wings daemon - using egg default');
            }

            const envPromises = Object.entries(environment).map(([key, value]) =>
                http.put(`/api/client/servers/${daemonType}/${uuid}/startup/variable`, {
                    key,
                    value,
                }),
            );
            await Promise.all(envPromises);

            if (should_backup) {
                await http.post(`/api/client/servers/${daemonType}/${uuid}/backups`, {
                    name: `Software Change Backup - ${new Date().toISOString()}`,
                    is_locked: false,
                });
            }

            if (should_wipe) {
                const filesResponse = await http.get(
                    `/api/client/servers/${daemonType}/${uuid}/files/list?directory=/`,
                );
                const files = filesResponse.data?.data || [];
                if (files.length > 0) {
                    const fileNames = files.map((file: any) => file.name);
                    await http.post(`/api/client/servers/${daemonType}/${uuid}/files/delete`, {
                        root: '/',
                        files: fileNames,
                    });
                }
            }

            await http.post(`/api/client/servers/${daemonType}/${uuid}/settings/reinstall`);
        } catch (error) {
            console.error('Failed to apply egg change for Wings:', error);
            throw error;
        }
    }
};
