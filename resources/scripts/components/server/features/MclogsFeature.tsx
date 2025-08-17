import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsCheck from '@/components/elements/hugeicons/Check';
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

const MclogsFeature = () => {
    const [visible, setVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<MclogsInsight | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const analyzeCrash = useCallback(async () => {
        // Open modal as we begin
        setVisible(true);
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

            if (result.analysis?.problems?.length > 0) {
                toast.success(`Crash analysis complete - ${result.analysis.problems.length} issue(s) found`);
            } else {
                toast.info('Log analysis complete - no specific issues detected');
            }
        } catch (err) {
            if (!mountedRef.current) return;

            const errorMessage = err instanceof Error ? err.message : 'Failed to analyze server logs';
            setError(errorMessage);
            console.error('Mclogs analysis failed:', err);

            // Only show error toast for unexpected errors, not missing log file
            const looksLikeMissingLog =
                /latest\.log/i.test(errorMessage) ||
                /not found/i.test(errorMessage) ||
                /no log content/i.test(errorMessage);

            if (!looksLikeMissingLog) {
                toast.error('Failed to analyze server logs');
            }
        } finally {
            if (mountedRef.current) setAnalyzing(false);
        }
    }, [uuid]);

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
            void analyzeCrash();
        }, MANUAL_ANALYZE_DEBOUNCE);
    }, [analyzeCrash]);

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

    const closeModal = () => {
        if (analyzing) return; // prevent closing while mid-run (matches closeOnBackground behavior)
        setVisible(false);
        setAnalysis(null);
        setError(null);
    };

    const renderProblemSolutions = (problem: Problem) => (
        <div className='space-y-2'>
            <div className='flex items-start gap-2'>
                <HugeIconsAlert className='w-4 h-4 text-red-400 mt-0.5 flex-shrink-0' fill='currentColor' />
                <div className='flex-1'>
                    <p className='text-sm font-medium text-red-400'>{problem.message}</p>
                    {!!problem.entry?.lines?.length && (
                        <div className='mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs font-mono text-red-300'>
                            {problem.entry.lines.map((line, idx) => (
                                <div key={idx}>
                                    <span className='text-red-500/60 mr-2'>{line.number}:</span>
                                    {line.content}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {!!problem.solutions?.length && (
                <div className='ml-6 space-y-1'>
                    <p className='text-xs font-medium text-green-400'>Suggested Solutions:</p>
                    {problem.solutions.map((solution, idx) => (
                        <div key={idx} className='flex items-start gap-2'>
                            <HugeIconsCheck
                                className='w-3 h-3 text-green-400 mt-0.5 flex-shrink-0'
                                fill='currentColor'
                            />
                            <p className='text-xs text-green-300'>{solution.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

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
            <div className='space-y-6'>
                {/* Server Info */}
                <div className='p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                    <h3 className='font-semibold text-blue-400 mb-2'>Server Information</h3>
                    <div className='text-sm space-y-1'>
                        <p>
                            <span className='text-neutral-400'>Software:</span> {analysis.title}
                        </p>
                        <p>
                            <span className='text-neutral-400'>Version:</span> {analysis.version}
                        </p>
                    </div>
                </div>

                {/* Problems */}
                {problems.length > 0 && (
                    <div className='space-y-4'>
                        <h3 className='font-semibold text-red-400'>Issues Found ({problems.length})</h3>
                        <div className='space-y-4'>
                            {problems.map((problem, idx) => (
                                <div key={idx} className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                                    {renderProblemSolutions(problem)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Information */}
                {information.length > 0 && (
                    <div className='space-y-4'>
                        <h3 className='font-semibold text-blue-400'>Server Details</h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {information.map((info, idx) => (
                                <div key={idx} className='p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                                    <p className='text-sm'>
                                        <span className='font-medium text-blue-400'>{info.label}:</span>
                                        <span className='ml-2 text-neutral-300'>{info.value}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {problems.length === 0 && (
                    <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-lg'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsCheck className='w-5 h-5 text-green-400' fill='currentColor' />
                            <p>
                                No specific issues were detected in your server logs. The crash may be due to a
                                configuration issue or resource limitation.
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
            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-2 mb-4'>
                    <HugeIconsTerminal className='w-5 h-5 text-orange-400' fill='currentColor' />
                    <span className='text-sm text-neutral-400'>Powered by mclo.gs</span>
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

                <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-700'>
                    <ActionButton
                        variant='secondary'
                        onClick={manualAnalyze}
                        disabled={analyzing}
                    >
                        {analyzing ? 'Analyzing...' : 'Analyze Again'}
                    </ActionButton>
                    <ActionButton
                        variant='primary'
                        onClick={closeModal}
                        disabled={analyzing}
                    >
                        Close
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};

export default MclogsFeature;
