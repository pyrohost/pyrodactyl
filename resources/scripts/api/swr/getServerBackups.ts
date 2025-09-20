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
        usedMb: number;
        limitMb: number | null;
        hasLimit: boolean;
        usagePercentage: number | null;
        availableMb: number | null;
        isOverLimit: boolean;
    };
    limits: {
        countLimit: number | null;
        hasCountLimit: boolean;
        storageLimitMb: number | null;
        hasStorageLimit: boolean;
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
    });
};
