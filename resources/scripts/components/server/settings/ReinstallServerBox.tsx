import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const ReinstallServerBox = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Tu servidor ha iniciado el proceso de instalación.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Reinstalar servidor'}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirmar la reinstalación'}
                confirm={'Sí, quiero reinstalar el servidor'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                Tu servidor se detendrá y algunos archivos podrán ser eliminados o modificados durante este proceso.
                ¿Quieres continuar?
            </Dialog.Confirm>
            <p className={`text-sm`}>
                Reinstalar tu servidor lo detendrá para después ejecutar el script de instalación.
                <strong className={`font-medium`}>
                    Algunos archivos podrán ser eliminados o modificados durante el proceso. Por favor, asegúrate de hacer
                    una copia de seguridad antes.
                </strong>
            </p>
            <div className={`mt-6 text-right`}>
                <ActionButton variant='danger' onClick={() => setModalVisible(true)}>
                    Reinstalar
                </ActionButton>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
