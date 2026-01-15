import { useHeader } from '@/contexts/HeaderContext';
import { memo, useEffect, useMemo } from 'react';
import isEqual from 'react-fast-compare';

import HeaderCentered from '@/components/dashboard/header/HeaderCentered';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import PageContentBlock from '@/components/elements/PageContentBlock';
// import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import StatGraphs from '@/components/server/console/StatGraphs';

import { ServerContext } from '@/state/server';

import Features from '@feature/Features';

import ServerDetailsHeader from './ServerDetailsHeader';
import { StatusPillHeader } from './StatusPillHeader';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const { setHeaderActions, clearHeaderActions } = useHeader();

    const statusSection = useMemo(
        () => (
            <HeaderCentered className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                    <StatusPillHeader />
                    <span className='xl:max-w-[20vw] min-w-0 truncate'>{name}</span>
                </div>

                <div className='border-l border-gray-200 h-6' />
                <ServerDetailsHeader />
            </HeaderCentered>
        ),
        [name],
    );

    const buttonsSection = useMemo(() => <PowerButtons className='flex gap-2 items-center justify-center' />, []);

    useEffect(() => {
        setHeaderActions([statusSection, buttonsSection]);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions, statusSection, buttonsSection]);

    return (
        <PageContentBlock title={'Console'} background={false} className='overflow-y-visible'>
            <div className='w-full h-full flex gap-4'>
                {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                    <Alert type={'warning'} className={'mb-4'}>
                        {isNodeUnderMaintenance
                            ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                            : isInstalling
                                ? 'This server is currently running its installation process and most actions are unavailable.'
                                : 'This server is currently being transferred to another node and all actions are unavailable.'}
                    </Alert>
                )}
                <Console />
                <div className='relative w-(--sidebar-full-width) overflow-y-auto overflow-x-visible flex-none -mb-(--main-wrapper-spacing) pb-(--main-wrapper-spacing)'>
                    <div className='flex flex-col gap-4'>
                        <Spinner.Suspense>
                            <StatGraphs />
                        </Spinner.Suspense>
                    </div>
                </div>

                <ErrorBoundary>
                    <Features enabled={eggFeatures} />
                </ErrorBoundary>
            </div>
        </PageContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
