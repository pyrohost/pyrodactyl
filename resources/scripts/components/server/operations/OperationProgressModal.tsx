import React, { useEffect, useState } from 'react';

import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';

import {
    UI_CONFIG,
    canCloseOperation,
    formatDuration,
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
        <Modal
            visible={visible}
            onDismissed={canClose ? handleClose : () => {}}
            closeOnEscape={canClose}
            closeOnBackground={canClose}
        >
            <div className='w-full max-w-md mx-auto'>
                <div className='bg-[#1a1a1a] border border-[#ffffff12] rounded-lg p-6'>
                    <div className='text-center space-y-6'>
                        <div className='space-y-2'>
                            <h3 className='text-lg font-semibold text-neutral-200'>{operationType} in Progress</h3>
                            {operationId && (
                                <p className='text-xs text-neutral-400 font-mono'>
                                    Operation ID: {formatOperationId(operationId)}
                                </p>
                            )}
                        </div>
                        {error ? (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-center space-x-3'>
                                    <HugeIconsAlert fill='currentColor' className='w-6 h-6 text-red-400' />
                                    <span className='text-red-400 font-medium'>Error</span>
                                </div>
                                <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
                                    <p className='text-sm text-red-300'>{error}</p>
                                </div>
                            </div>
                        ) : operation ? (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-center space-x-3'>
                                    {renderStatusIcon(operation.status)}
                                    <span
                                        className={`font-medium capitalize ${statusStyling?.color || 'text-neutral-400'}`}
                                    >
                                        {operation.status}
                                    </span>
                                </div>

                                <div className='p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                                    <p className='text-sm text-neutral-300'>{operation.message || 'Processing...'}</p>
                                </div>

                                <div className='text-xs text-neutral-400'>
                                    Duration: {formatDuration(operation.created_at, operation.updated_at)}
                                </div>

                                {isActiveStatus(operation.status) && (
                                    <div className='w-full bg-[#ffffff08] rounded-full h-1.5'>
                                        <div
                                            className='bg-brand h-1.5 rounded-full animate-pulse transition-all duration-300'
                                            style={{ width: `${UI_CONFIG.ESTIMATED_PROGRESS_WIDTH}%` }}
                                        />
                                    </div>
                                )}

                                {isCompletedStatus(operation.status) && (
                                    <div
                                        className={`p-3 ${statusStyling?.bgColor} border ${statusStyling?.borderColor} rounded-lg`}
                                    >
                                        <p className={`text-sm ${statusStyling?.textColor} font-medium`}>
                                            ✓ Operation completed successfully
                                        </p>
                                        {autoCloseTimer && (
                                            <p className='text-xs text-green-200 mt-1'>
                                                This window will close automatically in 3 seconds
                                            </p>
                                        )}
                                    </div>
                                )}

                                {isFailedStatus(operation.status) && (
                                    <div
                                        className={`p-3 ${statusStyling?.bgColor} border ${statusStyling?.borderColor} rounded-lg`}
                                    >
                                        <p className={`text-sm ${statusStyling?.textColor} font-medium`}>
                                            ✗ Operation failed
                                        </p>
                                        {operation.message && (
                                            <p className='text-xs text-red-200 mt-1'>{operation.message}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-center space-x-3'>
                                    <Spinner size={'small'} />
                                    <span className='text-neutral-400'>Initializing...</span>
                                </div>
                            </div>
                        )}

                        <div className='flex justify-center space-x-3'>
                            {canClose && (
                                <button
                                    onClick={handleClose}
                                    className='px-4 py-2 bg-brand hover:bg-brand/80 text-white text-sm font-medium rounded-lg transition-colors'
                                >
                                    {operation?.is_completed ? 'Done' : 'Close'}
                                </button>
                            )}

                            {operation && isActiveStatus(operation.status) && (
                                <div className='text-xs text-neutral-500 flex items-center'>
                                    <span>This window will close automatically when complete</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OperationProgressModal;
