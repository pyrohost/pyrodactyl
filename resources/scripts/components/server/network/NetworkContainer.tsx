import { For } from 'million/react';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { PageListContainer } from '@/components/elements/pages/PageList';
import AllocationRow from '@/components/server/network/AllocationRow';

import createServerAllocation from '@/api/server/network/createServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';

import { ServerContext } from '@/state/server';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useFlashKey } from '@/plugins/useFlash';

const NetworkContainer = () => {
    const [_, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock title={'Red'}>
            <FlashMessageRender byKey={'server:network'} />
            <MainPageHeader
                direction='column'
                title={'Red'}
                titleChildren={
                    data && allocationLimit > 0 ? (
                        <Can action={'allocation.create'}>
                            <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {data.filter((allocation) => !allocation.isDefault).length} de {allocationLimit}{' '}
                                    asignaciones permitidas
                                </p>
                                {allocationLimit > data.filter((allocation) => !allocation.isDefault).length && (
                                    <ActionButton variant='primary' onClick={onCreateAllocation}>
                                        Nueva asignación
                                    </ActionButton>
                                )}
                            </div>
                        </Can>
                    ) : undefined
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Configura las asignaciones de tu servidor. Gestiona las direcciones IP y puertos que tu servidor puede
                    usar para las conexiones entrantes.
                </p>
            </MainPageHeader>

            {!data ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : data.length > 0 ? (
                <PageListContainer data-pyro-network-container-allocations>
                    <For each={data} memo>
                        {(allocation) => (
                            <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                        )}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <svg className='w-8 h-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    fillRule='evenodd'
                                    d='M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {allocationLimit > 0 ? 'No allocations found' : 'Allocations unavailable'}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {allocationLimit > 0
                                ? 'Your server does not have any network allocations. Create one to get started.'
                                : 'Network allocations cannot be created for this server.'}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
