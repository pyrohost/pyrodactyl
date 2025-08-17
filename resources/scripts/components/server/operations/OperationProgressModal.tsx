import React, { useEffect, useState } from 'react';

import { Dialog } from '@/components/elements/dialog';
import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';

import {
    UI_CONFIG,
    canCloseOperation,
    formatOperationId,
    getStatusIconType,
    getStatusStyling,
    isActiveStatus,
    isCompletedStatus,
    isFailedStatus,
} from '@/lib/server-operations';

import { ServerOperation, useOperationPolling } from '@/api/server/serverOperations';

import { ServerContext } from '@/state/server';

interface Props {
    visible: boolean;
    operationId: string | null;
    operationType: string;
    onClose: () => void;
    onComplete?: (operation: ServerOperation) => void;
    onError?: (error: Error) => void;
}

/**
 * Modal component for displaying server operation progress in real-time.
 * Handles polling, auto-close, and status updates for long-running operations.
 */
const OperationProgressModal: React.FC<Props> = ({
    visible,
    operationId,
    operationType,
    onClose,
    onComplete,
    onError,
}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [operation, setOperation] = useState<ServerOperation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
    const { startPolling, stopPolling } = useOperationPolling();

    useEffect(() => {
        if (!visible || !operationId) {
            stopPolling(operationId || '');
            setOperation(null);
            setError(null);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                setAutoCloseTimer(null);
            }
            return;
        }

        const handleUpdate = (op: ServerOperation) => {
            setOperation(op);
        };

        const handleComplete = (op: ServerOperation) => {
            setOperation(op);
            stopPolling(operationId);

            if (onComplete) {
                onComplete(op);
            }

            if (op.is_completed) {
                const timer = setTimeout(() => {
                    onClose();
                }, UI_CONFIG.AUTO_CLOSE_DELAY);
                setAutoCloseTimer(timer);
            }
        };

        const handleError = (err: Error) => {
            setError(err.message);
            stopPolling(operationId);

            if (onError) {
                onError(err);
            }
        };

        startPolling(uuid, operationId, handleUpdate, handleComplete, handleError);

        return () => {
            stopPolling(operationId);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
        };
    }, [visible, operationId, uuid, startPolling, stopPolling, onComplete, onError, onClose, autoCloseTimer]);

    const renderStatusIcon = (status: string) => {
        const iconType = getStatusIconType(status as any);

        switch (iconType) {
            case 'spinner':
                return <Spinner size={'small'} />;
            case 'success':
                return (
                    <div className='w-5 h-5 rounded-full bg-green-400 flex items-center justify-center'>
                        <div className='w-2 h-2 rounded-full bg-white' />
                    </div>
                );
            case 'error':
                return <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400' />;
            default:
                return <Spinner size={'small'} />;
        }
    };

    const canClose = canCloseOperation(operation, error);
    const statusStyling = operation ? getStatusStyling(operation.status) : null;

    const handleClose = () => {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            setAutoCloseTimer(null);
        }
        onClose();
    };

    return (
        <Dialog
            open={visible}
            onClose={canClose ? handleClose : () => {}}
            preventExternalClose={!canClose}
            hideCloseIcon={!canClose}
            title={`${operationType}`}
        >
            <div className='w-full max-w-sm mx-auto'>
                <div className='space-y-6'>
                    {/* Operation ID */}
                    {operationId && (
                        <div className='text-center'>
                            <p className='text-xs text-zinc-500 font-mono bg-zinc-800/30 px-2 py-1 rounded'>
                                ID: {formatOperationId(operationId)}
                            </p>
                        </div>
                    )}
                    
                    {/* Error State */}
                    {error ? (
                        <div className='space-y-4 text-center'>
                            <div className='flex items-center justify-center space-x-2'>
                                <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400' />
                                <span className='text-red-400 font-medium'>Error</span>
                            </div>
                            <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left'>
                                <p className='text-sm text-red-300'>{error}</p>
                            </div>
                        </div>
                    ) : operation ? (
                        /* Operation State */
                        <div className='space-y-5'>
                            {/* Status Header */}
                            <div className='text-center'>
                                <div className='flex items-center justify-center space-x-3 mb-4'>
                                    {renderStatusIcon(operation.status)}
                                    <span
                                        className={`font-semibold capitalize text-lg ${statusStyling?.color || 'text-zinc-300'}`}
                                    >
                                        {operation.status}
                                    </span>
                                </div>
                            </div>

                            {/* Message Box */}
                            <div className='p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-lg'>
                                <p className='text-sm text-zinc-300 text-center'>
                                    {operation.message || 'Processing...'}
                                </p>
                            </div>

                            {/* Progress Bar for Active Operations */}
                            {isActiveStatus(operation.status) && (
                                <div className='space-y-2'>
                                    <div className='w-full bg-zinc-800/60 rounded-full h-2'>
                                        <div
                                            className='bg-brand h-2 rounded-full animate-pulse transition-all duration-500 ease-out'
                                            style={{ width: `${UI_CONFIG.ESTIMATED_PROGRESS_WIDTH}%` }}
                                        />
                                    </div>
                                    <div className='text-center'>
                                        <p className='text-xs text-zinc-500'>
                                            This window will close automatically when complete
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Success State */}
                            {isCompletedStatus(operation.status) && (
                                <div
                                    className={`p-4 ${statusStyling?.bgColor} border ${statusStyling?.borderColor} rounded-lg text-center`}
                                >
                                    <p className={`text-sm ${statusStyling?.textColor} font-medium mb-1`}>
                                        ✓ Operation completed successfully
                                    </p>
                                    {autoCloseTimer && (
                                        <p className='text-xs text-green-200'>
                                            Closing automatically in 3 seconds
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Failed State */}
                            {isFailedStatus(operation.status) && (
                                <div
                                    className={`p-4 ${statusStyling?.bgColor} border ${statusStyling?.borderColor} rounded-lg text-center`}
                                >
                                    <p className={`text-sm ${statusStyling?.textColor} font-medium mb-1`}>
                                        ✗ Operation failed
                                    </p>
                                    {operation.message && (
                                        <p className='text-xs text-red-200'>{operation.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Loading State */
                        <div className='text-center space-y-4'>
                            <div className='flex items-center justify-center space-x-3'>
                                <Spinner size={'small'} />
                                <span className='text-zinc-400 font-medium'>Initializing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {canClose && (
                <Dialog.Footer>
                    <ActionButton onClick={handleClose} variant='primary' className='w-full'>
                        {operation?.is_completed ? 'Done' : 'Close'}
                    </ActionButton>
                </Dialog.Footer>
            )}
        </Dialog>
    );
};

export default OperationProgressModal;
