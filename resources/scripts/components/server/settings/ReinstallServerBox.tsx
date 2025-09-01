import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const ReinstallServerBox = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
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
            .then(() => setModalVisible(false));
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
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    Reinstalar
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
