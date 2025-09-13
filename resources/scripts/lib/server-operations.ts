import { OPERATION_STATUS, OperationStatus } from '@/api/server/serverOperations';

/**
 * UI configuration constants for server operations.
 */
export const UI_CONFIG = {
    AUTO_CLOSE_DELAY: 3000,
    PROGRESS_UPDATE_INTERVAL: 30000,
    ESTIMATED_PROGRESS_WIDTH: 60,
} as const;

/**
 * Status styling configuration for different operation states.
 */
export const STATUS_CONFIG = {
    [OPERATION_STATUS.PENDING]: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-300',
    },
    [OPERATION_STATUS.RUNNING]: {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-300',
    },
    [OPERATION_STATUS.COMPLETED]: {
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        textColor: 'text-green-300',
    },
    [OPERATION_STATUS.FAILED]: {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-300',
    },
    [OPERATION_STATUS.CANCELLED]: {
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
        textColor: 'text-gray-300',
    },
} as const;

/**
 * Get status-specific styling configuration.
 */
export const getStatusStyling = (status: OperationStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[OPERATION_STATUS.PENDING];
};

/**
 * Get appropriate icon type for operation status.
 */
export const getStatusIconType = (status: OperationStatus): 'spinner' | 'success' | 'error' => {
    switch (status) {
        case OPERATION_STATUS.PENDING:
        case OPERATION_STATUS.RUNNING:
            return 'spinner';
        case OPERATION_STATUS.COMPLETED:
            return 'success';
        case OPERATION_STATUS.FAILED:
        case OPERATION_STATUS.CANCELLED:
            return 'error';
        default:
            return 'spinner';
    }
};

/**
 * Check if operation modal can be closed or dismissed.
 */
export const canCloseOperation = (operation: any, error: string | null): boolean => {
    return Boolean((operation && (operation.is_completed || operation.has_failed)) || error);
};

/**
 * Format operation ID for compact display.
 */
export const formatOperationId = (operationId: string): string => {
    return `${operationId.split('-')[0]}...`;
};

/**
 * Check if operation status is active (pending or running).
 */
export const isActiveStatus = (status: OperationStatus): boolean => {
    return status === OPERATION_STATUS.PENDING || status === OPERATION_STATUS.RUNNING;
};

/**
 * Check if operation status indicates successful completion.
 */
export const isCompletedStatus = (status: OperationStatus): boolean => {
    return status === OPERATION_STATUS.COMPLETED;
};

/**
 * Check if operation status indicates failure or cancellation.
 */
export const isFailedStatus = (status: OperationStatus): boolean => {
    return status === OPERATION_STATUS.FAILED || status === OPERATION_STATUS.CANCELLED;
};
