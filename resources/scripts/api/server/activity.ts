import { toPaginatedSet } from '@definitions/helpers';
import type { ActivityLog } from '@definitions/user';
import { Transformers } from '@definitions/user';
import type { AxiosError } from 'axios';
import type { SWRConfiguration } from 'swr';
import useSWR from 'swr';

import type { PaginatedResult, QueryBuilderParams } from '@/api/http';
import http, { withQueryBuilderParams } from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

import { ServerContext } from '@/state/server';

import useFilteredObject from '@/plugins/useFilteredObject';
import { useServerSWRKey } from '@/plugins/useSWRKey';

export type ActivityLogFilters = QueryBuilderParams<'ip' | 'event', 'timestamp'>;

const useActivityLogs = (
    filters?: ActivityLogFilters,
    config?: SWRConfiguration<PaginatedResult<ActivityLog>, AxiosError>,
) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();
    const key = useServerSWRKey(['activity', useFilteredObject(filters || {})]);

    return useSWR<PaginatedResult<ActivityLog>>(
        key,
        async () => {
            const { data } = await http.get(`/api/client/servers/${daemonType}/${uuid}/activity`, {
                params: {
                    ...withQueryBuilderParams(filters),
                    include: ['actor'],
                },
            });

            return toPaginatedSet(data, Transformers.toActivityLog);
        },
        { revalidateOnMount: false, ...(config || {}) },
    );
};

export { useActivityLogs };
