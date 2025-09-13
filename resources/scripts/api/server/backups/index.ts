import http from '@/api/http';

export const restoreServerBackup = async (uuid: string, backup: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/backups/${backup}/restore`, {});
};

export { default as createServerBackup } from './createServerBackup';
export { default as deleteServerBackup } from './deleteServerBackup';
export { default as getServerBackupDownloadUrl } from './getServerBackupDownloadUrl';
export { default as renameServerBackup } from './renameServerBackup';
