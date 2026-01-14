import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default async (uuid: string, password: string, twoFactor: any, totpCode: any): Promise<number> => {
    const daemonType = getGlobalDaemonType();
    const response = await http.delete(`/api/client/servers/${daemonType}/${uuid}/backups/delete-all`, {
        data: {
            password: password,
            ...(twoFactor ? { totp_code: totpCode } : {}),
        },
    });

    return response.status;
};
