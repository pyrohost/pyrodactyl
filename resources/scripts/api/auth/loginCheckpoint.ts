import type { LoginResponse } from "@/api/auth/login";
import http from "@/api/http";

export default (
	token: string,
	code: string,
	recoveryToken?: string,
): Promise<LoginResponse> => {
	return new Promise((resolve, reject) => {
		http
			.post("/auth/login/checkpoint", {
				confirmation_token: token,
				authentication_code: code,
				recovery_token:
					recoveryToken && recoveryToken.length > 0 ? recoveryToken : undefined,
			})
			.then((response) =>
				resolve({
					complete: response.data.data.complete,
					intended: response.data.data.intended || undefined,
				}),
			)
			.catch(reject);
	});
};
