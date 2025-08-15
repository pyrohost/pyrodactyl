import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import Code from '@/components/elements/Code';
import { Dialog } from '@/components/elements/dialog';

import { deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';

import { useFlashKey } from '@/plugins/useFlash';

const DeleteSSHKeyButton = ({ name, fingerprint }: { name: string; fingerprint: string }) => {
    const { clearAndAddHttpError } = useFlashKey('ssh-keys');
    const [visible, setVisible] = useState(false);
    const { mutate } = useSSHKeys();

    const onClick = () => {
        clearAndAddHttpError();

        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== fingerprint), false),
            deleteSSHKey(fingerprint),
        ]).catch((error) => {
            mutate(undefined, true).catch(console.error);
            clearAndAddHttpError(error);
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={'Delete SSH Key'}
                confirm={'Delete Key'}
                onConfirmed={onClick}
                onClose={() => setVisible(false)}
            >
                Removing the <Code>{name}</Code> SSH key will invalidate its usage across the Panel.
            </Dialog.Confirm>
            <button
                className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-150'
                onClick={() => setVisible(true)}
            >
                <FontAwesomeIcon icon={faTrashAlt} size='lg' />
            </button>
        </>
    );
};

export default DeleteSSHKeyButton;
