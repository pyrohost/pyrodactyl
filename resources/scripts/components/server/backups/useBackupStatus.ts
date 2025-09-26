import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerBackup } from '@/api/server/types';
import getBackupStatus, { BackupJobStatus } from '@/api/server/backups/getBackupStatus';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

interface UseBackupStatusReturn {
    status: BackupJobStatus | null;
    loading: boolean;
    error: string | null;
    pollNow: () => void;
    stopPolling: () => void;
    startPolling: () => void;
}

export const useBackupStatus = (
    serverUuid: string,
    backup: ServerBackup,
    options: {
        enabled?: boolean;
        pollInterval?: number;
        stopWhenComplete?: boolean;
    } = {}
): UseBackupStatusReturn => {
    const {
        enabled = true,
        pollInterval = 3000, // 3 seconds
        stopWhenComplete = true,
    } = options;

    const [status, setStatus] = useState<BackupJobStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    // Determine if we should be actively polling
    const shouldPoll = enabled &&
                      backup.isInProgress &&
                      backup.jobId &&
                      isPolling;

    const pollStatus = useCallback(async () => {
        if (!backup.jobId || !mountedRef.current) return;

        try {
            setLoading(true);
            setError(null);

            const newStatus = await getBackupStatus(serverUuid, backup.uuid);

            if (mountedRef.current) {
                setStatus(newStatus);

                // Stop polling if job is complete and option is enabled
                if (stopWhenComplete && !['pending', 'running'].includes(newStatus.status)) {
                    setIsPolling(false);
                }
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch backup status');
                // Stop polling on error
                setIsPolling(false);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [serverUuid, backup.uuid, backup.jobId, stopWhenComplete]);

    const pollNow = useCallback(() => {
        pollStatus();
    }, [pollStatus]);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (backup.isInProgress && backup.jobId) {
            setIsPolling(true);
        }
    }, [backup.isInProgress, backup.jobId]);

    // Set up polling interval
    useEffect(() => {
        if (shouldPoll) {
            // Poll immediately when starting
            pollStatus();

            // Set up interval for future polls
            intervalRef.current = setInterval(pollStatus, pollInterval);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [shouldPoll, pollStatus, pollInterval]);

    // Auto-start polling for in-progress backups
    useEffect(() => {
        if (enabled && backup.isInProgress) {
            startPolling();
        }
    }, [enabled, backup.isInProgress, startPolling]);

    // Listen for WebSocket events for real-time updates
    useWebsocketEvent('backup.status', (data: any) => {
        if (data.backup_uuid === backup.uuid && mountedRef.current) {
            setStatus({
                job_id: data.job_id,
                status: data.status,
                progress: data.progress,
                message: data.message,
                error: data.error,
                is_successful: data.is_successful,
                can_cancel: data.can_cancel,
                can_retry: data.can_retry,
                started_at: data.started_at,
                last_updated_at: data.last_updated_at,
                completed_at: data.completed_at,
            });

            // Stop polling if job completed via WebSocket
            if (stopWhenComplete && !['pending', 'running'].includes(data.status)) {
                setIsPolling(false);
            }
        }
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            stopPolling();
        };
    }, [stopPolling]);

    return {
        status,
        loading,
        error,
        pollNow,
        stopPolling,
        startPolling,
    };
};