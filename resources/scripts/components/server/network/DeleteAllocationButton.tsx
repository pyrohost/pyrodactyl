import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
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
                title={'Eliminar puerto'}
                confirm={'Eliminar'}
                onConfirmed={deleteAllocation}
            >
                Este puerto se eliminará inmediatamente de tu servidor.
            </Dialog.Confirm>
            <ActionButton
                variant='danger'
                size='sm'
                onClick={() => setConfirm(true)}
                className='flex items-center gap-2'
            >
                <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                <span className='hidden sm:inline'>Eliminar</span>
            </ActionButton>
        </>
    );
};

export default DeleteAllocationButton;
