import http, { FractalResponseData, FractalResponseList } from '@/api/http';
import { ServerEggVariable, ServerStatus } from '@/api/server/types';
import { rawDataToServerAllocation, rawDataToServerEggVariable } from '@/api/transformers';

// import { getGlobalDaemonType } from '@/api/server/getServer';

let globalDaemonType: string | null = null;

export interface Allocation {
    id: number;
    ip: string;
    alias: string | null;
    port: number;
    notes: string | null;
    isDefault: boolean;
}

export interface Server {
    id: string;
    internalId: number | string;
    uuid: string;
    name: string;
    node: string;
    isNodeUnderMaintenance: boolean;
    status: ServerStatus;
    sftpDetails: {
        ip: string;
        port: number;
    };
    invocation: string;
    dockerImage: string;
    description: string;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
        threads: string;
    };
    eggFeatures: string[];
    featureLimits: {
        databases: number;
        allocations: number;
        backups: number;
        backupStorageMb: number | null;
    };
    isTransferring: boolean;
    variables: ServerEggVariable[];
    allocations: Allocation[];
    egg: string;
    daemonType: string;
}

export const rawDataToServerObject = ({ attributes: data }: FractalResponseData): Server => ({
    id: data.identifier,
    internalId: data.internal_id,
    uuid: data.uuid,
    name: data.name,
    node: data.node,
    isNodeUnderMaintenance: data.is_node_under_maintenance,
    status: data.status,
    invocation: data.invocation,
    dockerImage: data.docker_image,
    sftpDetails: {
        ip: data.sftp_details.ip,
        port: data.sftp_details.port,
    },
    description: data.description ? (data.description.length > 0 ? data.description : null) : null,
    limits: { ...data.limits },
    eggFeatures: data.egg_features || [],
    featureLimits: { ...data.feature_limits },
    isTransferring: data.is_transferring,
    variables: ((data.relationships?.variables as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerEggVariable,
    ),
    allocations: ((data.relationships?.allocations as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerAllocation,
    ),
    egg: data.egg,
    daemonType: data.daemonType,
});

export default async (uuid: string): Promise<[Server, string[]]> => {
    let daemonType_api = 'elytra';
    return http
        .get(`/api/client/servers/${uuid}`)
        .then((response) => {
            daemonType_api = response.data?.meta.daemonType;
            const daemonType: string = response.data?.meta.daemonType;

            if (daemonType) {
                globalDaemonType = daemonType;
            }

            return http.get(`/api/client/servers/${daemonType}/${uuid}`);
        })
        .then((response) => {
            const payload = response.data;

            const server = rawDataToServerObject(payload);
            server.daemonType = daemonType_api;

            const permissions = payload.meta?.is_server_owner
                ? ['*']
                : (payload.meta?.user_permissions as string[] | undefined) || [];

            return [server, permissions] as [Server, string[]];
        })
        .catch((error) => {
            console.error('Failed to load server:', error);
            throw error;
        });
};

export const getGlobalDaemonType = (): string | null => globalDaemonType;
export const setGlobalDaemonType = (type: string): void => {
    globalDaemonType = type;
};
