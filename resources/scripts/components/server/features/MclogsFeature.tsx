import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsCheck from '@/components/elements/hugeicons/Check';
import HugeIconsChevronDown from '@/components/elements/hugeicons/ChevronDown';
import HugeIconsChevronRight from '@/components/elements/hugeicons/ChevronRight';
import HugeIconsLink from '@/components/elements/hugeicons/Link';
import HugeIconsTerminal from '@/components/elements/hugeicons/Terminal';
import { SocketEvent } from '@/components/server/events';

import { debounce, isCrashLine } from '@/lib/mclogsUtils';

import { MclogsInsight, analyzeLogs } from '@/api/mclo.gs/mclogsApi';
import getFileContents from '@/api/server/files/getFileContents';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const CRASH_DETECTION_DEBOUNCE = 3000; // 3 seconds
const MANUAL_ANALYZE_DEBOUNCE = 1000; // 1 second for manual clicks
const LOG_FILE_PATH = '/logs/latest.log';
const MAX_CONSOLE_BUFFER = 300;

type Problem = MclogsInsight['analysis']['problems'][number];

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
                (analyzeCrashDebounced as any)?.cancel?.();
                (manualAnalyze as any)?.cancel?.();
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
                    <div className='flex items-start justify-between gap-3'>
                        <div className='flex items-start gap-2 flex-1'>
                            <HugeIconsAlert className='w-5 h-5 mt-0.5 flex-shrink-0' fill='currentColor' />
                            <div className='flex-1'>
                                <p className='font-medium text-sm'>Crash Analysis</p>
                                <p className='text-sm mt-1'>{getCardMessage()}</p>
                            </div>
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

    const renderProblemSolutions = (problem: Problem, problemIndex: number) => (
        <Disclosure defaultOpen={problemIndex === 0}>
            {({ open }) => (
                <div className='border border-red-500/20 rounded-lg overflow-hidden'>
                    <DisclosureButton className='w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/15 transition-colors'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <HugeIconsAlert className='w-4 h-4 text-red-400 flex-shrink-0' fill='currentColor' />
                                <p className='text-sm font-medium text-red-400 text-left truncate'>{problem.message}</p>
                            </div>
                            {open ? (
                                <HugeIconsChevronDown className='w-4 h-4 text-red-400 flex-shrink-0' />
                            ) : (
                                <HugeIconsChevronRight className='w-4 h-4 text-red-400 flex-shrink-0' />
                            )}
                        </div>
                    </DisclosureButton>

                    <DisclosurePanel className='px-3 pb-3'>
                        {!!problem.entry?.lines?.length && (
                            <div className='mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded text-xs font-mono'>
                                <div className='text-red-400/70 text-xs mb-1 font-sans'>Crash Log:</div>
                                <div className='max-h-32 overflow-y-auto space-y-1'>
                                    {problem.entry.lines.map((line, idx) => (
                                        <div key={idx} className='flex'>
                                            <span className='text-red-500/50 mr-3 select-none w-8 text-right flex-shrink-0'>
                                                {line.number}
                                            </span>
                                            <span className='text-red-300/90 break-all'>{line.content}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!!problem.solutions?.length && (
                            <div className='mt-3 space-y-2'>
                                <p className='text-xs font-medium text-green-400'>Solutions:</p>
                                <div className='space-y-1'>
                                    {problem.solutions.map((solution, idx) => (
                                        <div key={idx} className='flex items-start gap-2'>
                                            <HugeIconsCheck
                                                className='w-3 h-3 text-green-400 mt-0.5 flex-shrink-0'
                                                fill='currentColor'
                                            />
                                            <p className='text-xs text-green-300/90'>{solution.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DisclosurePanel>
                </div>
            )}
        </Disclosure>
    );

    // Render analysis content helper function
    const renderAnalysisContent = () => {
        if (analyzing) {
            return (
                <div className='flex flex-col items-center justify-center py-8' aria-busy='true'>
                    <Spinner size='large' />
                    <p className='text-neutral-400 mt-4'>Analyzing server logs with mclo.gs...</p>
                    <p className='text-neutral-500 text-sm mt-1'>This may take a few moments</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert type='danger'>
                    <div className='flex items-start gap-2'>
                        <HugeIconsAlert className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' fill='currentColor' />
                        <div>
                            <p className='font-medium'>Analysis Failed</p>
                            <p className='text-sm mt-1'>{error}</p>
                            {(/latest\.log/i.test(error) || /no log content/i.test(error)) && (
                                <p className='text-sm mt-2 text-neutral-400'>
                                    This usually means the log file doesn&apos;t exist yet. Try running the server
                                    first.
                                </p>
                            )}
                        </div>
                    </div>
                </Alert>
            );
        }

        if (!analysis) {
            return (
                <div className='text-center py-8'>
                    <p className='text-neutral-400'>No analysis data available</p>
                </div>
            );
        }

        const problems = analysis.analysis?.problems ?? [];
        const information = analysis.analysis?.information ?? [];

        return (
            <div className='space-y-4'>
                {/* Server Info - Compact */}
                <div className='p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                    <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-4'>
                            <span className='text-blue-400 font-medium'>
                                {analysis.title} {analysis.version}
                            </span>
                        </div>
                        <span className='text-neutral-400 text-xs'>mclo.gs analysis</span>
                    </div>
                </div>

                {/* Problems */}
                {problems.length > 0 && (
                    <div className='space-y-3'>
                        <h3 className='font-semibold text-red-400 text-sm'>Issues Found ({problems.length})</h3>
                        <div className='space-y-2'>
                            {problems.map((problem, idx) => (
                                <div key={idx}>{renderProblemSolutions(problem, idx)}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Information - Condensed */}
                {information.length > 0 && (
                    <div className='space-y-3'>
                        <h3 className='font-semibold text-blue-400 text-sm'>Server Details</h3>
                        <div className='grid grid-cols-2 gap-2'>
                            {information.map((info, idx) => (
                                <div key={idx} className='p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs'>
                                    <span className='font-medium text-blue-400'>{info.label}:</span>
                                    <span className='ml-1 text-neutral-300 break-all'>{info.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {problems.length === 0 && (
                    <div className='p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsCheck className='w-4 h-4 text-green-400' fill='currentColor' />
                            <p className='text-sm'>
                                No specific issues detected. The crash may be due to configuration or resource
                                limitations.
                            </p>
                        </div>
                    </div>
                )}
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
            <div className='w-full max-w-2xl'>
                <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                        <HugeIconsTerminal className='w-4 h-4 text-orange-400' fill='currentColor' />
                        <span className='text-sm text-neutral-400'>Log Analysis</span>
                    </div>
                    <a
                        href='https://mclo.gs'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1'
                    >
                        <HugeIconsLink className='w-3 h-3' />
                        mclo.gs
                    </a>
                </div>

                {renderAnalysisContent()}

                <div className='flex justify-end gap-2 mt-4 pt-3 border-t border-neutral-700'>
                    <ActionButton variant='secondary' onClick={manualAnalyze} disabled={analyzing} size='sm'>
                        {analyzing ? 'Analyzing...' : 'Analyze Again'}
                    </ActionButton>
                    <ActionButton variant='primary' onClick={closeModal} disabled={analyzing} size='sm'>
                        Close
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};
