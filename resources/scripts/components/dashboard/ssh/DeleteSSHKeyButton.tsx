import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import Code from '@/components/elements/Code';
import { Dialog } from '@/components/elements/dialog';

import { deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';

import { useFlashKey } from '@/plugins/useFlash';

const DeleteSSHKeyButton = ({ name, fingerprint }: { name: string; fingerprint: string }) => {
    const { clearAndAddHttpError } = useFlashKey('account');
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
                title={'Eliminar clave SSH'}
                confirm={'Eliminar la clave'}
                onConfirmed={onClick}
                onClose={() => setVisible(false)}
            >
                Eliminar la clave <Code>{name}</Code> la invalidará en todo el panel y sus aplicaciones.
            </Dialog.Confirm>
            <button className={`p-2 text-red-500 hover:text-red-700`} onClick={() => setVisible(true)}>
                <FontAwesomeIcon icon={faTrashAlt} size='lg' />{' '}
            </button>
        </>
    );
};

export default DeleteSSHKeyButton;
