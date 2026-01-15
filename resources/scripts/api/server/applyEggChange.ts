import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface ApplyEggChangeRequest {
    egg_id: number;
    nest_id: number;
    docker_image?: string;
    startup_command?: string;
    environment?: Record<string, string>;
    should_backup?: boolean;
    should_wipe?: boolean;
}

export interface ApplyEggChangeResponse {
    message: string;
    operation_id: string;
    status: string;
}

/**
 * Apply egg configuration changes to a server asynchronously.
 * This initiates a background operation to change the server's egg configuration.
 */
export default async (uuid: string, data: ApplyEggChangeRequest): Promise<ApplyEggChangeResponse> => {
    const daemonType = getGlobalDaemonType();

    const { data: response } = await http.post(`/api/client/servers/${daemonType}/${uuid}/settings/egg/apply`, data);
    return response;
};
