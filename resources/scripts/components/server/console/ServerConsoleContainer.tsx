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

import { StatusPill } from './StatusPill';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    return (
        <ServerContentBlock title={'Home'}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col gap-4'>
                {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                    <Alert type={'warning'} className={'mb-4'}>
                        {isNodeUnderMaintenance
                            ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                            : isInstalling
                              ? 'This server is currently running its installation process and most actions are unavailable.'
                              : 'This server is currently being transferred to another node and all actions are unavailable.'}
                    </Alert>
                )}
                <MainPageHeader title={name} titleChildren={<StatusPill />}>
                    <PowerButtons className='skeleton-anim-2 duration-75 flex gap-1 items-center justify-center' />
                </MainPageHeader>
                {description && (
                    <h2 className='text-sm -mt-8'>
                        <span className='opacity-50'>{description}</span>
                    </h2>
                )}
                <ServerDetailsBlock />
                <Console />
                <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
                    <Spinner.Suspense>
                        <StatGraphs />
                    </Spinner.Suspense>
                </div>
                <ErrorBoundary>
                    <Features enabled={eggFeatures} />
                </ErrorBoundary>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
