import { faChartBar, faServer, faTerminal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';
import isEqual from 'react-fast-compare';

import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
// import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import StatGraphs from '@/components/server/console/StatGraphs';

import { ServerContext } from '@/state/server';

import Features from '@feature/Features';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    // const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    return (
        <ServerContentBlock title={'Home'}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '50ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <Alert type={'warning'}>
                            {isNodeUnderMaintenance
                                ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                                : isInstalling
                                  ? 'This server is currently running its installation process and most actions are unavailable.'
                                  : 'This server is currently being transferred to another node and all actions are unavailable.'}
                        </Alert>
                    </div>
                )}

                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title={name}>
                        <div
                            className='transform-gpu skeleton-anim-2'
                            style={{
                                animationDelay: '100ms',
                                animationTimingFunction:
                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                            }}
                        >
                            <PowerButtons className='flex gap-1 items-center justify-center' />
                        </div>
                    </MainPageHeader>
                </div>

                <div className='flex flex-col gap-3 sm:gap-4'>
                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '125ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <div className='flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
                                <div className='w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                    <FontAwesomeIcon
                                        icon={faServer}
                                        className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400'
                                    />
                                </div>
                                <h3 className='text-sm sm:text-base font-semibold text-zinc-100'>Server Resources</h3>
                            </div>
                            <ServerDetailsBlock />
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '175ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <div className='flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
                                <div className='w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                    <FontAwesomeIcon
                                        icon={faTerminal}
                                        className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400'
                                    />
                                </div>
                                <h3 className='text-sm sm:text-base font-semibold text-zinc-100'>Console</h3>
                            </div>
                            <Console />
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '225ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <div className='flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
                                <div className='w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                    <FontAwesomeIcon
                                        icon={faChartBar}
                                        className='w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400'
                                    />
                                </div>
                                <h3 className='text-sm sm:text-base font-semibold text-zinc-100'>
                                    Performance Metrics
                                </h3>
                            </div>
                            <div className={'grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4'}>
                                <Spinner.Suspense>
                                    <StatGraphs />
                                </Spinner.Suspense>
                            </div>
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '275ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ErrorBoundary>
                            <Features enabled={eggFeatures} />
                        </ErrorBoundary>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
