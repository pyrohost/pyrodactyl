import { useEffect, useState, useRef } from 'react';
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

import { analyzeLogs, MclogsInsight } from '@/api/mclo.gs/mclogsApi';
import getFileContents from '@/api/server/files/getFileContents';
import { isCrashLine, debounce } from '@/lib/mclogsUtils';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const CRASH_DETECTION_DEBOUNCE = 3000; // 3 seconds
const LOG_FILE_PATH = '/logs/latest.log';

const MclogsFeature = () => {
    const [visible, setVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<MclogsInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const lastCrashDetectionRef = useRef<number>(0);

    // Debounced crash analysis function
    const debouncedAnalyzeCrash = useRef(
        debounce(async () => {
            const now = Date.now();
            // Prevent analyzing too frequently
            if (now - lastCrashDetectionRef.current < CRASH_DETECTION_DEBOUNCE) {
                return;
            }
            lastCrashDetectionRef.current = now;

            setAnalyzing(true);
            setError(null);
            setVisible(true);

            try {
                // Read the latest.log file
                const logContent = await getFileContents(uuid, LOG_FILE_PATH);
                
                if (!logContent || logContent.trim().length === 0) {
                    throw new Error('No log content found in latest.log');
                }

                // Analyze with mclo.gs
                const result = await analyzeLogs(logContent);
                setAnalysis(result);

                // Show toast notification about the analysis
                if (result.analysis.problems.length > 0) {
                    toast.success(`Crash analysis complete - ${result.analysis.problems.length} issue(s) found`);
                } else {
                    toast.info('Log analysis complete - no specific issues detected');
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to analyze server logs';
                setError(errorMessage);
                console.error('Mclogs analysis failed:', err);
                
                // Only show error toast for unexpected errors, not file not found
                if (!errorMessage.includes('latest.log')) {
                    toast.error('Failed to analyze server logs');
                }
            } finally {
                setAnalyzing(false);
            }
        }, CRASH_DETECTION_DEBOUNCE)
    ).current;

    // Listen for console output and detect crashes
    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        // Only analyze if server is not running (likely crashed)
        if (status === 'running') return;

        if (isCrashLine(data)) {
            debouncedAnalyzeCrash();
        }
    });

    // Manual analysis function (could be triggered by a button)
    const manualAnalyze = async () => {
        await debouncedAnalyzeCrash();
    };

    const closeModal = () => {
        setVisible(false);
        setAnalysis(null);
        setError(null);
    };

    const renderProblemSolutions = (problem: MclogsInsight['analysis']['problems'][0]) => (
        <div className='space-y-2'>
            <div className='flex items-start gap-2'>
                <HugeIconsAlert className='w-4 h-4 text-red-400 mt-0.5 flex-shrink-0' fill='currentColor' />
                <div className='flex-1'>
                    <p className='text-sm font-medium text-red-400'>{problem.message}</p>
                    {problem.entry.lines.length > 0 && (
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
            
            {problem.solutions.length > 0 && (
                <div className='ml-6 space-y-1'>
                    <p className='text-xs font-medium text-green-400'>Suggested Solutions:</p>
                    {problem.solutions.map((solution, idx) => (
                        <div key={idx} className='flex items-start gap-2'>
                            <HugeIconsCheck className='w-3 h-3 text-green-400 mt-0.5 flex-shrink-0' fill='currentColor' />
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
                <div className='flex flex-col items-center justify-center py-8'>
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
                            {error.includes('latest.log') && (
                                <p className='text-sm mt-2 text-neutral-400'>
                                    This usually means the log file doesn't exist yet. Try running the server first.
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

        return (
            <div className='space-y-6'>
                {/* Server Info */}
                <div className='p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                    <h3 className='font-semibold text-blue-400 mb-2'>Server Information</h3>
                    <div className='text-sm space-y-1'>
                        <p><span className='text-neutral-400'>Software:</span> {analysis.title}</p>
                        <p><span className='text-neutral-400'>Version:</span> {analysis.version}</p>
                    </div>
                </div>

                {/* Problems */}
                {analysis.analysis.problems.length > 0 && (
                    <div className='space-y-4'>
                        <h3 className='font-semibold text-red-400'>Issues Found ({analysis.analysis.problems.length})</h3>
                        <div className='space-y-4'>
                            {analysis.analysis.problems.map((problem, idx) => (
                                <div key={idx} className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                                    {renderProblemSolutions(problem)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Information */}
                {analysis.analysis.information.length > 0 && (
                    <div className='space-y-4'>
                        <h3 className='font-semibold text-blue-400'>Server Details</h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {analysis.analysis.information.map((info, idx) => (
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

                {analysis.analysis.problems.length === 0 && (
                    <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-lg'>
                        <div className='flex items-center gap-2'>
                            <HugeIconsCheck className='w-5 h-5 text-green-400' fill='currentColor' />
                            <p>No specific issues were detected in your server logs. The crash may be due to a configuration issue or resource limitation.</p>
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
                    {!analyzing && (
                        <>
                            <ActionButton variant='secondary' onClick={manualAnalyze} disabled={analyzing}>
                                Analyze Again
                            </ActionButton>
                            <ActionButton variant='primary' onClick={closeModal}>
                                Close
                            </ActionButton>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MclogsFeature;