import { For } from 'million/react';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

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
        <ServerContentBlock showFlashKey={'server:network'} title={'Network'}>
            <MainPageHeader title={'Network'}>
                {!data ? null : (
                    <>
                        {allocationLimit > 0 && (
                            <Can action={'allocation.create'}>
                                <div className={`flex flex-col sm:flex-row items-center justify-end`}>
                                    <p className={`text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0 text-right`}>
                                        {data.length} of {allocationLimit} allowed allocations
                                    </p>
                                    {allocationLimit > data.length && (
                                        <button
                                            style={{
                                                background:
                                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                            }}
                                            className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md cursor-pointer'
                                            onClick={onCreateAllocation}
                                        >
                                            New Allocation
                                        </button>
                                    )}
                                </div>
                            </Can>
                        )}
                    </>
                )}
            </MainPageHeader>
            {!data ? null : (
                <>
                    <PageListContainer data-pyro-network-container-allocations>
                        <For each={data} memo>
                            {(allocation) => (
                                <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                            )}
                        </For>
                    </PageListContainer>
                </>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
