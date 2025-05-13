import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';

import ConfirmationModal from '@/components/elements/ConfirmationModal';

import { httpErrorToHuman } from '@/api/http';
import deleteSubuser from '@/api/server/users/deleteSubuser';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

export default ({ subuser }: { subuser: Subuser }) => {
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
                showSpinnerOverlay={loading}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setShowConfirmation(false)}
            >
                All access to the server will be removed immediately.
            </ConfirmationModal>
            <button
                type={'button'}
                aria-label={'Delete subuser'}
                className={`text-sm p-2 text-zinc-500 hover:text-red-600 transition-colors duration-150 flex align-middle items-center justify-center flex-col cursor-pointer`}
                onClick={() => setShowConfirmation(true)}
            >
                <FontAwesomeIcon icon={faTrashAlt} className={`px-5`} size='lg' />
                Delete
            </button>
        </>
    );
};
