import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import HugeIconsTrash from '@/components/elements/hugeicons/Trash';

import { httpErrorToHuman } from '@/api/http';
import deleteSubuser from '@/api/server/users/deleteSubuser';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

const RemoveSubuserButton = ({ subuser }: { subuser: Subuser }) => {
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const removeSubuser = ServerContext.useStoreActions((actions) => actions.subusers.removeSubuser);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('users');
        deleteSubuser(uuid, subuser.uuid)
            .then(() => {
                setLoading(false);
                removeSubuser(subuser.uuid);
                setShowConfirmation(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
                setShowConfirmation(false);
            });
    };

    return (
        <>
            <ConfirmationModal
                title={`Remove ${subuser.username}?`}
                buttonText={`Remove ${subuser.username}`}
                visible={showConfirmation}
                loading={loading}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setShowConfirmation(false)}
            >
                All access to the server will be removed immediately.
            </ConfirmationModal>
            <ActionButton
                variant='danger'
                size='sm'
                className='flex items-center gap-2'
                onClick={() => setShowConfirmation(true)}
                aria-label='Delete subuser'
            >
                <HugeIconsTrash fill='currentColor' className='w-4 h-4' />
                Delete
            </ActionButton>
        </>
    );
};

export default RemoveSubuserButton;
