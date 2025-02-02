import { createContext, useContext } from 'react';
import useSWR from 'swr';
import { usePage } from '@inertiajs/react';

import type { PaginatedResult } from '@/api/http';
import http, { getPaginationSet } from '@/api/http';
import type { ServerBackup } from '@/api/server/types';
import { rawDataToServerBackup } from '@/api/transformers';

interface ctx {
    page: number;
    setPage: (value: number | ((s: number) => number)) => void;
}

export const Context = createContext<ctx>({ page: 1, setPage: () => 1 });

type BackupResponse = PaginatedResult<ServerBackup> & { backupCount: number };

export default () => {
    const { page } = useContext(Context);
    const { server } = usePage().props;

    return useSWR<BackupResponse>(['server:backups', server.uuid, page], async () => {
        const { data } = await http.get(`/api/client/servers/${server.uuid}/backups`, { params: { page } });

        return {
            items: (data.data || []).map(rawDataToServerBackup),
            pagination: getPaginationSet(data.meta.pagination),
            backupCount: data.meta.backup_count,
        };
    });
};