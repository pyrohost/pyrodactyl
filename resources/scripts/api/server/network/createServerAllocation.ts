import http from "@/api/http";
import type { Allocation } from "@/api/server/getServer";
import { getGlobalDaemonType } from "@/api/server/getServer";
import { rawDataToServerAllocation } from "@/api/transformers";

export default async (uuid: string): Promise<Allocation> => {
	const { data } = await http.post(
		`/api/client/servers/${getGlobalDaemonType()}/${uuid}/network/allocations`,
	);

	return rawDataToServerAllocation(data);
};
