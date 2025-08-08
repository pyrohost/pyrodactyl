import { useState } from 'react';

import { Dialog } from '@/components/elements/dialog';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';

import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';

import { ServerContext } from '@/state/server';

import { useFlashKey } from '@/plugins/useFlash';

interface Props {
    allocation: number;
}

const DeleteAllocationButton = ({ allocation }: Props) => {
    const [confirm, setConfirm] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

    const deleteAllocation = () => {
        clearFlashes();

        setConfirm(false);

        mutate((data) => data?.filter((a) => a.id !== allocation), false);
        setServerFromState((s) => ({ ...s, allocations: s.allocations.filter((a) => a.id !== allocation) }));

        deleteServerAllocation(uuid, allocation).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={confirm}
                onClose={() => setConfirm(false)}
                title={'Remove Allocation'}
                confirm={'Delete'}
                onConfirmed={deleteAllocation}
            >
                This allocation will be immediately removed from your server.
            </Dialog.Confirm>
            <button
                type='button'
                onClick={() => setConfirm(true)}
                className='flex items-center justify-center gap-2 px-3 py-2 bg-[#ffffff11] hover:bg-red-600/20 rounded-lg text-sm text-zinc-300 hover:text-red-400 transition-colors duration-150'
            >
                <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                <span className='hidden sm:inline'>Delete</span>
            </button>
        </>
    );
};

export default DeleteAllocationButton;
