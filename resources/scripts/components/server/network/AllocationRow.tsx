import debounce from 'debounce';
import { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';

import Can from '@/components/elements/Can';
import Code from '@/components/elements/Code';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Textarea } from '@/components/elements/Input';
import InputSpinner from '@/components/elements/InputSpinner';
import { Button } from '@/components/elements/button/index';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';

import { ip } from '@/lib/formatters';

import { Allocation } from '@/api/server/getServer';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import getServerAllocations from '@/api/swr/getServerAllocations';

import { ServerContext } from '@/state/server';

import { useFlashKey } from '@/plugins/useFlash';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <div className='bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff15] p-4 sm:p-5 rounded-xl hover:border-[#ffffff20] transition-all'>
            <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap mb-2'>
                        {allocation.alias ? (
                            <CopyOnClick text={allocation.alias}>
                                <h3 className='text-lg font-medium text-zinc-100 font-mono'>{allocation.alias}</h3>
                            </CopyOnClick>
                        ) : (
                            <CopyOnClick text={ip(allocation.ip)}>
                                <h3 className='text-lg font-medium text-zinc-100 font-mono'>{ip(allocation.ip)}</h3>
                            </CopyOnClick>
                        )}
                        <span className='text-zinc-500'>:</span>
                        <span className='text-lg font-medium text-zinc-100 font-mono'>{allocation.port}</span>
                    </div>
                    <div className='min-h-[2rem] flex items-end'>
                        <InputSpinner visible={loading}>
                            <Textarea
                                className='w-full bg-transparent border-0 p-0 text-sm text-zinc-400 placeholder-zinc-500 resize-none focus:ring-0 focus:text-zinc-300'
                                placeholder='Add notes for this allocation...'
                                defaultValue={allocation.notes || undefined}
                                onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                                rows={1}
                            />
                        </InputSpinner>
                    </div>
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                    {allocation.isDefault ? (
                        <div className='flex items-center justify-center px-4 py-2 bg-brand/20 border border-brand/30 rounded-lg text-sm text-brand font-medium'>
                            Primary Port
                        </div>
                    ) : (
                        <>
                            <Can action={'allocation.update'}>
                                <button
                                    type='button'
                                    onClick={setPrimaryAllocation}
                                    className='flex items-center justify-center gap-2 px-3 py-2 bg-[#ffffff11] hover:bg-[#ffffff19] rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors duration-150'
                                >
                                    <span className='hidden sm:inline'>Make Primary</span>
                                    <span className='sm:hidden'>Primary</span>
                                </button>
                            </Can>
                            <Can action={'allocation.delete'}>
                                <DeleteAllocationButton allocation={allocation.id} />
                            </Can>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(AllocationRow, isEqual);
