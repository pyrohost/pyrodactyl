import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import Button from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
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
            <div className={'flex flex-row justify-between items-center mb-8'}>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Networking</h1>
                {!data ? (
                    <></>
                ) : (
                    <>
                        {allocationLimit > 0 && (
                            <Can action={'allocation.create'}>
                                <SpinnerOverlay visible={loading} />
                                <div css={tw`sm:flex items-center justify-end`}>
                                    <p css={tw`text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0`}>
                                        {data.length} of {allocationLimit} allowed allocations
                                    </p>
                                    {allocationLimit > data.length && (
                                        <button
                                            style={{
                                                background:
                                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                                            }}
                                            className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md'
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
            </div>
            {!data ? (
                // <Spinner size={'large'} centered />
                <></>
            ) : (
                <>
                    {data.map((allocation) => (
                        <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                    ))}
                </>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
