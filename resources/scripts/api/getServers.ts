import http, { type PaginatedResult, getPaginationSet } from "@/api/http";
import { type Server, rawDataToServerObject } from "@/api/server/getServer";

interface QueryParams {
	query?: string;
	page?: number;
	type?: string;
}

export default ({
	query,
	...params
}: QueryParams): Promise<PaginatedResult<Server>> => {
	return new Promise((resolve, reject) => {
		http
			.get("/api/client", {
				params: {
					"filter[*]": query,
					...params,
				},
			})
			.then(({ data }) =>
				resolve({
					items: (data.data || []).map((datum: any) =>
						rawDataToServerObject(datum),
					),
					pagination: getPaginationSet(data.meta.pagination),
				}),
			)
			.catch(reject);
	});
};
