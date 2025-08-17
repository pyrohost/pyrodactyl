import { memo } from 'react';
import isEqual from 'react-fast-compare';

import ServerConsoleContainer from '@/components/server/console/ServerConsoleContainer';
import { CrashAnalysisCard } from '@/components/server/features/MclogsFeature';

import { ServerContext } from '@/state/server';

const ServerHomeContainer = () => {
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);

    // Check if mclogs feature is enabled
    const mclogsEnabled = eggFeatures.map((v) => v.toLowerCase()).includes('mclogs');

    return (
        <>
            {/* Crash Analysis Card - only show if mclogs feature is enabled */}
            {mclogsEnabled && (
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '25ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <CrashAnalysisCard />
                </div>
            )}

            {/* Main Server Console */}
            <ServerConsoleContainer />
        </>
    );
};

export default memo(ServerHomeContainer, isEqual);
