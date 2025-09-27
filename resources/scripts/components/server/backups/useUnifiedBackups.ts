import { useCallback, useState } from 'react';
import { SocketEvent } from '@/components/server/events';
import { ServerContext } from '@/state/server';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import getServerBackups from '@/api/swr/getServerBackups';
import { UnifiedBackup } from './BackupItem';

export const useUnifiedBackups = () => {
    const { data: backups, error, isValidating, mutate } = getServerBackups();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [liveProgress, setLiveProgress] = useState<Record<string, {
        status: string;
        progress: number;
        message: string;
        canRetry: boolean;
        lastUpdated: string;
        completed: boolean;
        isDeletion: boolean;
        backupName?: string;
    }>>({});

    const handleBackupStatus = useCallback((rawData: any) => {
        let data;
        try {
            if (typeof rawData === 'string') {
                data = JSON.parse(rawData);
            } else {
                data = rawData;
            }
        } catch (error) {
            return;
        }

        const backup_uuid = data?.backup_uuid;
        if (!backup_uuid) {
            return;
        }

        const {
            status,
            progress,
            message,
            timestamp,
            operation,
            error: errorMsg,
            adapter,
            name,
        } = data;


        const can_retry = status === 'failed' && operation === 'create';
        const last_updated_at = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
        const isDeletionOperation = operation === 'delete' || data.deleted === true;

        setLiveProgress(prevProgress => {
            const currentState = prevProgress[backup_uuid];
            const newProgress = progress || 0;
            const isCompleted = status === 'completed' && newProgress === 100;
            const displayMessage = errorMsg ? `${message || 'Operation failed'}: ${errorMsg}` : (message || '');

            if (currentState?.completed && !isCompleted) {
                return prevProgress;
            }

            if (currentState && !isCompleted && currentState.lastUpdated >= last_updated_at && currentState.progress >= newProgress) {
                return prevProgress;
            }

            return {
                ...prevProgress,
                [backup_uuid]: {
                    status,
                    progress: newProgress,
                    message: displayMessage,
                    canRetry: can_retry || false,
                    lastUpdated: last_updated_at,
                    completed: isCompleted,
                    isDeletion: isDeletionOperation,
                    backupName: name || currentState?.backupName,
                }
            };
        });

        if (status === 'completed' && progress === 100) {
            mutate();

            if (isDeletionOperation) {
                setTimeout(() => {
                    setLiveProgress(prev => {
                        const updated = { ...prev };
                        delete updated[backup_uuid];
                        return updated;
                    });
                }, 500);
            } else {
                const checkForBackup = async (attempts = 0) => {
                    if (attempts > 10) {
                        setLiveProgress(prev => {
                            const updated = { ...prev };
                            delete updated[backup_uuid];
                            return updated;
                        });
                        return;
                    }

                    // Force fresh data
                    await mutate();

                    const currentBackups = await mutate();
                    const backupExists = currentBackups?.items?.some(b => b.uuid === backup_uuid);

                    if (backupExists) {
                        setLiveProgress(prev => {
                            const updated = { ...prev };
                            delete updated[backup_uuid];
                            return updated;
                        });
                    } else {
                        setTimeout(() => checkForBackup(attempts + 1), 1000);
                    }
                };

                setTimeout(() => checkForBackup(), 1000);
            }
        }
    }, [mutate]);

    useWebsocketEvent(SocketEvent.BACKUP_STATUS, handleBackupStatus);

    const createBackup = useCallback(async (name: string, ignored: string, isLocked: boolean) => {
        const { default: createServerBackup } = await import('@/api/server/backups/createServerBackup');
        const result = await createServerBackup(uuid, { name, ignored, isLocked });
        mutate();
        return result;
    }, [uuid, mutate]);

    const deleteBackup = useCallback(async (backupUuid: string) => {
        const { deleteServerBackup } = await import('@/api/server/backups');
        const result = await deleteServerBackup(uuid, backupUuid);
        mutate();
        return result;
    }, [uuid, mutate]);

    const retryBackup = useCallback(async (backupUuid: string) => {
        const { retryBackup: retryBackupApi } = await import('@/api/server/backups');
        await retryBackupApi(uuid, backupUuid);
        mutate();
    }, [uuid, mutate]);

    const restoreBackup = useCallback(async (backupUuid: string) => {
        const { restoreServerBackup } = await import('@/api/server/backups');
        const result = await restoreServerBackup(uuid, backupUuid);
        mutate();
        return result;
    }, [uuid, mutate]);

    const renameBackup = useCallback(async (backupUuid: string, newName: string) => {
        const http = (await import('@/api/http')).default;
        await http.post(`/api/client/servers/${uuid}/backups/${backupUuid}/rename`, { name: newName });
        mutate();
    }, [uuid, mutate]);

    const toggleBackupLock = useCallback(async (backupUuid: string) => {
        const http = (await import('@/api/http')).default;
        await http.post(`/api/client/servers/${uuid}/backups/${backupUuid}/lock`);
        mutate();
    }, [uuid, mutate]);

    const unifiedBackups: UnifiedBackup[] = [];

    if (backups?.items) {
        for (const backup of backups.items) {
            const live = liveProgress[backup.uuid];

            unifiedBackups.push({
                uuid: backup.uuid,
                name: live?.backupName || backup.name,
                status: live ? live.status as any : (backup.isSuccessful ? 'completed' : 'failed'),
                progress: live ? live.progress : (backup.isSuccessful ? 100 : 0),
                message: live ? live.message : (backup.isSuccessful ? 'Completed' : 'Failed'),
                isSuccessful: backup.isSuccessful,
                isLocked: backup.isLocked,
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
        const existsInSwr = unifiedBackups.some(b => b.uuid === backupUuid);

        if (!existsInSwr && !live.isDeletion) {
            unifiedBackups.push({
                uuid: backupUuid,
                name: live.backupName || live.message || 'Processing...',
                status: live.status as any,
                progress: live.progress,
                message: live.message,
                isSuccessful: false,
                isLocked: false,
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