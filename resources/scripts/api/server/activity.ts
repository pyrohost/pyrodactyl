// use SWR is removed due to function return complications, please uptime to Work faster and cache data
import type { QueryBuilderParams } from '@/api/http';
import http, { withQueryBuilderParams } from '@/api/http';

interface ActivityLogActor {
  object: 'user';
  attributes: {
    uuid: string;
    username: string;
    email: string;
    image: string;
    created_at: string;
  };
}

interface ActivityLog {
  object: 'activity_log';
  attributes: {
    id: string;
    batch: string | null;
    event: string;
    is_api: boolean;
    ip: string;
    description: string | null;
    properties: Record<string, any>;
    has_additional_metadata: boolean;
    timestamp: string;
    relationships: {
      actor: ActivityLogActor;
    };
  };
}

interface ActivityLogsResponse {
  object: 'list';
  data: ActivityLog[];
}

export type ActivityLogFilters = QueryBuilderParams<'ip' | 'event', 'timestamp'>;

const getActivityLogs = async (
  uuid: string,
  filters?: ActivityLogFilters,
): Promise<ActivityLog[]> => {
  const { data } = await http.get<ActivityLogsResponse>(`/api/client/servers/${uuid}/activity`, {
    params: {
      ...withQueryBuilderParams(filters),
      include: ['actor'],
    },
  });

  console.log(data)

  return data.data;
};

export type { ActivityLog };
export { getActivityLogs };