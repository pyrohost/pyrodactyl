import React from 'react';

import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

/**
 * Server operation status constants.
 */
export const OPERATION_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
} as const;

export type OperationStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

/**
 * Polling configuration for operation status updates.
 */
export const POLLING_CONFIG = {
    INITIAL_INTERVAL: 2000,
    MAX_INTERVAL: 8000,
    MAX_ATTEMPTS: 90,
    JITTER_RANGE: 500,
    BACKOFF_MULTIPLIER: 1.05,
    BACKOFF_THRESHOLD: 5,
};

export interface ServerOperation {
    operation_id: string;
    type: string;
    status: OperationStatus;
    message: string;
    created_at: string;
    updated_at: string;
    parameters?: Record<string, unknown>;
    is_active: boolean;
    is_completed: boolean;
    has_failed: boolean;
}

export interface ApplyEggChangeAsyncResponse {
    message: string;
    operation_id: string;
    status: string;
}

/**
 * Get specific operation status by ID.
 */
export const getOperationStatus = async (uuid: string, operationId: string): Promise<ServerOperation> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/operations/${operationId}`);
    return data;
};

/**
 * Get all operations for a server.
 */
export const getServerOperations = async (uuid: string): Promise<{ operations: ServerOperation[] }> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/operations`);
    return data;
};

/**
 * Poll operation status with exponential backoff and jitter.
 */
export const pollOperationStatus = (
    uuid: string,
    operationId: string,
    onUpdate: (operation: ServerOperation) => void,
    onComplete: (operation: ServerOperation) => void,
    onError: (error: Error) => void,
): (() => void) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalMs = POLLING_CONFIG.INITIAL_INTERVAL;
    const maxInterval = POLLING_CONFIG.MAX_INTERVAL;
    let attempts = 0;
    let stopped = false;

    const poll = async () => {
        if (stopped) return;

        try {
            attempts++;

            if (attempts > POLLING_CONFIG.MAX_ATTEMPTS) {
                onError(new Error('Operation polling timed out after 15 minutes'));
                return;
            }

            const operation = await getOperationStatus(uuid, operationId);

            if (stopped) return;

            onUpdate(operation);

            if (operation.is_completed || operation.has_failed) {
                onComplete(operation);
                return;
            }

            if (operation.is_active) {
                if (attempts > POLLING_CONFIG.BACKOFF_THRESHOLD) {
                    intervalMs = Math.min(intervalMs * POLLING_CONFIG.BACKOFF_MULTIPLIER, maxInterval);
                }

                const jitter = Math.random() * POLLING_CONFIG.JITTER_RANGE;
                timeoutId = setTimeout(poll, intervalMs + jitter);
            } else {
                onError(new Error('Operation is no longer active'));
            }
        } catch (error) {
            if (!stopped) {
                onError(error as Error);
            }
        }
    };

    timeoutId = setTimeout(poll, 1000);

    return () => {
        stopped = true;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
};

/**
 * React hook for managing operation polling lifecycle.
 */
export const useOperationPolling = () => {
    const activePollers = React.useRef(new Map<string, () => void>()).current;

    React.useEffect(() => {
        return () => {
            activePollers.forEach((cleanup) => cleanup());
            activePollers.clear();
        };
    }, [activePollers]);

    const startPolling = React.useCallback(
        (
            uuid: string,
            operationId: string,
            onUpdate: (operation: ServerOperation) => void,
            onComplete: (operation: ServerOperation) => void,
            onError: (error: Error) => void,
        ) => {
            stopPolling(operationId);
            const cleanup = pollOperationStatus(uuid, operationId, onUpdate, onComplete, onError);
            activePollers.set(operationId, cleanup);
        },
        [activePollers],
    );

    const stopPolling = React.useCallback(
        (operationId: string) => {
            const cleanup = activePollers.get(operationId);
            if (cleanup) {
                cleanup();
                activePollers.delete(operationId);
            }
        },
        [activePollers],
    );

    const stopAllPolling = React.useCallback(() => {
        activePollers.forEach((cleanup) => cleanup());
        activePollers.clear();
    }, [activePollers]);

    return {
        startPolling,
        stopPolling,
        stopAllPolling,
        hasActivePolling: (operationId: string) => activePollers.has(operationId),
    };
};
