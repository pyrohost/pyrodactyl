import { createContext, useContext } from 'react';
import useSWR from 'swr';

import type { PaginatedResult } from '@/api/http';
import http, { getPaginationSet } from '@/api/http';
import type { ServerBackup } from '@/api/server/types';
import { rawDataToServerBackup } from '@/api/transformers';

import { ServerContext } from '@/state/server';

interface ctx {
    page: number;
    setPage: (value: number | ((s: number) => number)) => void;
}

export const Context = createContext<ctx>({ page: 1, setPage: () => 1 });

type BackupResponse = PaginatedResult<ServerBackup> & {
    backupCount: number;
    storage: {
        used_mb: number;
        limit_mb: number | null;
        has_limit: boolean;
        usage_percentage: number | null;
        available_mb: number | null;
        is_over_limit: boolean;
    };
    limits: {
        count_limit: number | null;
        has_count_limit: boolean;
        storage_limit_mb: number | null;
        has_storage_limit: boolean;
    };
};

export default () => {
    const { page } = useContext(Context);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    return useSWR<BackupResponse>(['server:backups', uuid, page], async () => {
        const { data } = await http.get(`/api/client/servers/${uuid}/backups`, { params: { page } });

        return {
            items: (data.data || []).map(rawDataToServerBackup),
            pagination: getPaginationSet(data.meta.pagination),
            backupCount: data.meta.backup_count,
            storage: data.meta.storage,
            limits: data.meta.limits,
        };
    }, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
    });
};
