import { useCallback, useContext } from 'react';

import getServerBackups from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import { LiveProgressContext } from './BackupContainer';
import { UnifiedBackup } from './BackupItem';
import { getGlobalDaemonType } from '@/api/server/getServer';

export const useUnifiedBackups = () => {
    const { data: backups, error, isValidating, mutate } = getServerBackups();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const daemonType = getGlobalDaemonType();

    const liveProgress = useContext(LiveProgressContext);

    const createBackup = useCallback(
        async (name: string, ignored: string, isLocked: boolean) => {
            const { default: createServerBackup } = await import('@/api/server/backups/createServerBackup');
            const result = await createServerBackup(uuid, { name, ignored, isLocked });
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const deleteBackup = useCallback(
        async (backupUuid: string) => {
            const { deleteServerBackup } = await import('@/api/server/backups');
            const result = await deleteServerBackup(uuid, backupUuid);
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const retryBackup = useCallback(
        async (backupUuid: string) => {
            const { retryBackup: retryBackupApi } = await import('@/api/server/backups');
            await retryBackupApi(uuid, backupUuid);
            mutate();
        },
        [uuid, mutate],
    );

    const restoreBackup = useCallback(
        async (backupUuid: string) => {
            const { restoreServerBackup } = await import('@/api/server/backups');
            const result = await restoreServerBackup(uuid, backupUuid);
            mutate();
            return result;
        },
        [uuid, mutate],
    );

    const renameBackup = useCallback(
        async (backupUuid: string, newName: string) => {
            const http = (await import('@/api/http')).default;
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backupUuid}/rename`, { name: newName });
            mutate();
        },
        [uuid, mutate],
    );

    const toggleBackupLock = useCallback(
        async (backupUuid: string) => {
            const http = (await import('@/api/http')).default;
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backupUuid}/lock`);
            mutate();
        },
        [uuid, mutate],
    );

    const unifiedBackups: UnifiedBackup[] = [];

    if (backups?.items) {
        for (const backup of backups.items) {
            const live = liveProgress[backup.uuid];

            unifiedBackups.push({
                uuid: backup.uuid,
                name: live?.backupName || backup.name,
                status: live ? (live.status as any) : backup.isSuccessful ? 'completed' : 'failed',
                progress: live ? live.progress : backup.isSuccessful ? 100 : 0,
                message: live ? live.message : backup.isSuccessful ? 'Completed' : 'Failed',
                isSuccessful: backup.isSuccessful,
                isLocked: backup.isLocked,
                isAutomatic: backup.isAutomatic,
                checksum: backup.checksum,
                bytes: backup.bytes,
                createdAt: backup.createdAt,
                completedAt: backup.completedAt,
                canRetry: live ? live.canRetry : backup.canRetry,
                canDelete: live ? false : true,
                canDownload: backup.isSuccessful && !live,
                canRestore: backup.isSuccessful && !live,
                isLiveOnly: false,
                isDeletion: live?.isDeletion || false,
            });
        }
    }

    // Add live-only backups (new operations not yet in SWR)
    for (const [backupUuid, live] of Object.entries(liveProgress)) {
        const existsInSwr = unifiedBackups.some((b) => b.uuid === backupUuid);

        if (!existsInSwr && !live.isDeletion) {
            unifiedBackups.push({
                uuid: backupUuid,
                name: live.backupName || live.message || 'Processing...',
                status: live.status as any,
                progress: live.progress,
                message: live.message,
                isSuccessful: false,
                isLocked: false,
                isAutomatic: false,
                checksum: undefined,
                bytes: undefined,
                createdAt: new Date(),
                completedAt: null,
                canRetry: live.canRetry,
                canDelete: false,
                canDownload: false,
                canRestore: false,
                isLiveOnly: true,
                isDeletion: false,
            });
        }
    }

    unifiedBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
        backups: unifiedBackups,
        backupCount: backups?.backupCount || 0,
        storage: backups?.storage,
        pagination: backups?.pagination,
        error,
        isValidating,
        createBackup,
        deleteBackup,
        retryBackup,
        restoreBackup,
        renameBackup,
        toggleBackupLock,
        refresh: () => mutate(),
    };
};
