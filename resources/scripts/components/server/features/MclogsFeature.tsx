import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsCheck from '@/components/elements/hugeicons/Check';
import HugeIconsLink from '@/components/elements/hugeicons/Link';
import { SocketEvent } from '@/components/server/events';

import { debounce, isCrashLine } from '@/lib/mclogsUtils';

import { MclogsInsight, analyzeLogs } from '@/api/mclo.gs/mclogsApi';
import getFileContents from '@/api/server/files/getFileContents';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const CRASH_DETECTION_DEBOUNCE = 1500; // 1.5 seconds
const MANUAL_ANALYZE_DEBOUNCE = 1000; // 1 second for manual clicks
const LOG_FILE_PATH = '/logs/latest.log';
const MAX_CONSOLE_BUFFER = 300;

// Shared analysis logic hook
const useLogAnalysis = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<MclogsInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCard, setShowCard] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const consoleBufferRef = useRef<string[]>([]);
    const previousStatusRef = useRef(status);
    const mountedRef = useRef(true);

    // Keep console buffer trimmed and split chunks into lines
    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        const lines = String(data).split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return;

        consoleBufferRef.current.push(...lines);
        if (consoleBufferRef.current.length > MAX_CONSOLE_BUFFER) {
            // Trim to last MAX_CONSOLE_BUFFER lines
            consoleBufferRef.current = consoleBufferRef.current.slice(-MAX_CONSOLE_BUFFER);
        }
    });

    const analyzeCrash = useCallback(
        async (showToast = false) => {
            setAnalyzing(true);
            setError(null);

            try {
                const logContent = await getFileContents(uuid, LOG_FILE_PATH);

                if (!logContent || logContent.trim().length === 0) {
                    throw new Error('No log content found in latest.log');
                }

                const result = await analyzeLogs(logContent);
                if (!mountedRef.current) return;

                setAnalysis(result);
                setShowCard(true);

                // Show toast notifications for manual analysis
                if (showToast) {
                    if (result.analysis?.problems?.length > 0) {
                        toast.success(`Analysis complete - ${result.analysis.problems.length} issue(s) found`);
                    } else {
                        toast.info('Analysis complete - no specific issues detected');
                    }
                }
            } catch (err) {
                if (!mountedRef.current) return;

                const errorMessage = err instanceof Error ? err.message : 'Failed to analyze server logs';
                setError(errorMessage);
                console.error('Mclogs analysis failed:', err);

                // Show card even on error for auto-analysis
                setShowCard(true);

                // Only show error toast for manual analysis and unexpected errors
                const looksLikeMissingLog =
                    /latest\.log/i.test(errorMessage) ||
                    /not found/i.test(errorMessage) ||
                    /no log content/i.test(errorMessage);

                if (!looksLikeMissingLog && showToast) {
                    toast.error('Failed to analyze server logs');
                }
            } finally {
                if (mountedRef.current) setAnalyzing(false);
            }
        },
        [uuid],
    );

    // Debounced auto-analysis used when we detect crash indicators
    const analyzeCrashDebounced = useMemo(() => {
        const fn = debounce(() => {
            // Note: run the immediate version internally
            void analyzeCrash();
        }, CRASH_DETECTION_DEBOUNCE);

        return fn;
    }, [analyzeCrash]);

    // Monitor server status changes to detect crashes
    useEffect(() => {
        // If server just went offline, check recent console output for crash indicators
        if (previousStatusRef.current !== 'offline' && status === 'offline') {
            const hasCrashIndicators = consoleBufferRef.current.some((line) => isCrashLine(line));
            if (hasCrashIndicators) {
                analyzeCrashDebounced();
            }
        }

        // Update previous status
        previousStatusRef.current = status;
    }, [status, analyzeCrashDebounced]);

    // Manual analysis (debounced to prevent rapid clicking)
    const manualAnalyze = useMemo(() => {
        return debounce(() => {
            void analyzeCrash(true); // Show toast for manual analysis
        }, MANUAL_ANALYZE_DEBOUNCE);
    }, [analyzeCrash]);

    // Dismiss card
    const dismissCard = () => {
        setShowCard(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Best-effort cancel if debounce util provides cancel()
            try {
                (analyzeCrashDebounced as { cancel?: () => void })?.cancel?.();
                (manualAnalyze as { cancel?: () => void })?.cancel?.();
            } catch {
                // no-op
            }
        };
    }, [analyzeCrashDebounced, manualAnalyze]);

    return {
        analyzing,
        analysis,
        error,
        showCard,
        manualAnalyze,
        dismissCard,
        consoleBufferRef,
        previousStatusRef,
        mountedRef,
        analyzeCrashDebounced,
    };
};

// Crash Analysis Card Component
export const CrashAnalysisCard = () => {
    const { analyzing, analysis, error, showCard, dismissCard } = useLogAnalysis();

    const [modalVisible, setModalVisible] = useState(false);

    if (!showCard) return null;

    const getCardMessage = () => {
        if (analyzing) {
            return 'Analyzing server crash logs...';
        }

        if (error) {
            const looksLikeMissingLog =
                /latest\.log/i.test(error) || /not found/i.test(error) || /no log content/i.test(error);

            if (looksLikeMissingLog) {
                return 'Server crashed but no log file was found. Try running the server to generate logs.';
            }
            return 'Server crashed but analysis failed. Check the logs manually.';
        }

        if (!analysis) {
            return 'Server crashed. Analysis in progress...';
        }

        const problems = analysis.analysis?.problems ?? [];
        if (problems.length > 0) {
            return `We analyzed your server and found ${problems.length} issue${problems.length === 1 ? '' : 's'}.`;
        }

        return 'We analyzed your server crash but found no specific issues. This may be due to configuration or resource limitations.';
    };

    const getCardType = (): 'warning' | 'danger' => {
        if (analyzing) return 'warning';
        if (error) return 'danger';
        if (!analysis) return 'warning';
        const problems = analysis.analysis?.problems ?? [];
        return problems.length > 0 ? 'danger' : 'warning';
    };

    const canViewAnalysis = analysis && !error && !analyzing;

    return (
        <>
            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                <Alert type={getCardType()}>
                    <div className='flex items-center justify-between gap-3'>
                        <div className='flex-1'>
                            <p className='font-medium text-sm'>Crash Analysis</p>
                            <p className='text-sm mt-1'>{getCardMessage()}</p>
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                            {canViewAnalysis && (
                                <ActionButton variant='secondary' onClick={() => setModalVisible(true)} size='sm'>
                                    View Details
                                </ActionButton>
                            )}
                            <ActionButton variant='secondary' onClick={dismissCard} size='sm'>
                                Dismiss
                            </ActionButton>
                        </div>
                    </div>
                </Alert>
            </div>

            {/* Analysis Modal */}
            {modalVisible && (
                <AnalysisModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    analysis={analysis}
                    error={error}
                    analyzing={analyzing}
                />
            )}
        </>
    );
};

// Analysis Modal Component
const AnalysisModal = ({
    visible,
    onClose,
    analysis,
    error,
    analyzing,
}: {
    visible: boolean;
    onClose: () => void;
    analysis: MclogsInsight | null;
    error: string | null;
    analyzing: boolean;
}) => {
    const { manualAnalyze } = useLogAnalysis();

    const closeModal = () => {
        if (analyzing) return;
        onClose();
    };

    // Render loading state
    const renderLoadingState = () => (
        <div className='flex flex-col items-center justify-center py-12' aria-busy='true'>
            <Spinner size='large' />
            <h3 className='text-lg font-medium text-neutral-200 mt-4'>Analyzing Server Logs</h3>
            <p className='text-neutral-400 mt-2 text-center max-w-md'>
                We&apos;re analyzing your server logs with mclo.gs to identify potential issues and provide solutions.
            </p>
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className='space-y-6'>
            <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                    <HugeIconsAlert className='w-6 h-6 text-red-400 flex-shrink-0 mt-0.5' fill='currentColor' />
                    <div className='flex-1'>
                        <h3 className='font-semibold text-red-400 text-lg'>Analysis Failed</h3>
                        <p className='text-neutral-300 mt-2'>{error}</p>
                        {(/latest\.log/i.test(error!) || /no log content/i.test(error!)) && (
                            <p className='text-neutral-400 mt-3 text-sm'>
                                This usually means the log file doesn&apos;t exist yet. Try starting your server to
                                generate logs first.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Render server information header
    const renderServerInfo = () => {
        if (!analysis) return null;

        const information = analysis.analysis?.information ?? [];
        const serverVersion = analysis.version;
        const serverType = analysis.title;

        return (
            <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-lg font-semibold text-blue-400'>Server Information</h3>
                    <a
                        href='https://mclo.gs'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors'
                    >
                        <HugeIconsLink className='w-4 h-4' />
                        Powered by mclo.gs
                    </a>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div className='bg-blue-500/5 rounded-lg p-3'>
                        <p className='text-blue-400 font-medium text-sm mb-1'>Server Type</p>
                        <p className='text-neutral-200'>
                            {serverType} {serverVersion}
                        </p>
                    </div>

                    {information.slice(0, 3).map((info, idx) => (
                        <div key={idx} className='bg-blue-500/5 rounded-lg p-3'>
                            <p className='text-blue-400 font-medium text-sm mb-1'>{info.label}</p>
                            <p className='text-neutral-200 break-all'>{info.value}</p>
                        </div>
                    ))}
                </div>

                {information.length > 3 && (
                    <details className='mt-3'>
                        <summary className='text-blue-400 text-sm cursor-pointer hover:text-blue-300 transition-colors'>
                            Show {information.length - 3} more details
                        </summary>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
                            {information.slice(3).map((info, idx) => (
                                <div key={idx} className='bg-blue-500/5 rounded-lg p-3'>
                                    <p className='text-blue-400 font-medium text-sm mb-1'>{info.label}</p>
                                    <p className='text-neutral-200 break-all'>{info.value}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        );
    };

    // Render errors section
    const renderErrors = () => {
        if (!analysis) return null;

        const problems = analysis.analysis?.problems ?? [];

        if (problems.length === 0) {
            return (
                <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6'>
                    <div className='flex items-start gap-3'>
                        <HugeIconsCheck className='w-6 h-6 text-green-400 flex-shrink-0 mt-0.5' fill='currentColor' />
                        <div>
                            <h3 className='font-semibold text-green-400 text-lg'>No Issues Detected</h3>
                            <p className='text-neutral-300 mt-2'>
                                No specific issues were found in your server logs. The crash may be due to configuration
                                problems or resource limitations.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className='space-y-4 mb-6'>
                <h3 className='text-lg font-semibold text-red-400'>Issues Found ({problems.length})</h3>

                <div className='space-y-3'>
                    {problems.map((problem, idx) => (
                        <div key={idx} className='bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden'>
                            <div className='p-4'>
                                <div className='flex items-start gap-3'>
                                    <HugeIconsAlert
                                        className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5'
                                        fill='currentColor'
                                    />
                                    <div className='flex-1'>
                                        <h4 className='font-medium text-red-400 mb-2'>{problem.message}</h4>

                                        {!!problem.entry?.lines?.length && (
                                            <div className='bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-3'>
                                                <p className='text-red-400/70 text-sm mb-2 font-medium'>Error Log:</p>
                                                <div className='max-h-40 overflow-y-auto font-mono text-sm space-y-1'>
                                                    {problem.entry.lines.map((line, lineIdx) => (
                                                        <div key={lineIdx} className='flex'>
                                                            <span className='text-red-500/50 mr-3 select-none w-10 text-right flex-shrink-0'>
                                                                {line.number}
                                                            </span>
                                                            <span className='text-red-300/90 break-all'>
                                                                {line.content}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render recommendations section
    const renderRecommendations = () => {
        if (!analysis) return null;

        const problems = analysis.analysis?.problems ?? [];
        const allSolutions = problems.flatMap((problem) => problem.solutions || []);

        if (allSolutions.length === 0) return null;

        return (
            <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-green-400'>Recommended Solutions ({allSolutions.length})</h3>

                <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                    <div className='space-y-3'>
                        {allSolutions.map((solution, idx) => (
                            <div key={idx} className='flex items-start gap-3'>
                                <div className='bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5'>
                                    <HugeIconsCheck className='w-4 h-4 text-green-400' fill='currentColor' />
                                </div>
                                <div className='flex-1'>
                                    <p className='text-neutral-200 leading-relaxed'>{solution.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Main content renderer
    const renderContent = () => {
        if (analyzing) return renderLoadingState();
        if (error) return renderErrorState();
        if (!analysis) {
            return (
                <div className='text-center py-12'>
                    <p className='text-neutral-400'>No analysis data available</p>
                </div>
            );
        }

        return (
            <div className='space-y-6'>
                {renderServerInfo()}
                {renderErrors()}
                {renderRecommendations()}
            </div>
        );
    };

    return (
        <Modal
            visible={visible}
            onDismissed={closeModal}
            closeOnBackground={!analyzing}
            title='Server Log Analysis'
            showSpinnerOverlay={false}
        >
            <div className='w-full max-w-4xl'>
                {renderContent()}

                <div className='flex justify-center gap-3 mt-8 pt-4 border-t border-neutral-700'>
                    <ActionButton variant='secondary' onClick={manualAnalyze} disabled={analyzing}>
                        {analyzing ? 'Analyzing...' : 'Analyze Again'}
                    </ActionButton>
                    <ActionButton variant='primary' onClick={closeModal} disabled={analyzing}>
                        Close
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};
