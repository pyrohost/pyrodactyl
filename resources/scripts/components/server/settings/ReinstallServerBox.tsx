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
                    message: 'Your server has begun the reinstallation process.',
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
        <TitledGreyBox title={'Reinstall Server'}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server reinstallation'}
                confirm={'Yes, reinstall server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Dialog.Confirm>
            <p className={`text-sm`}>
                Reinstalling your server will stop it, and then re-run the installation script that initially set it
                up.&nbsp;
                <strong className={`font-medium`}>
                    Some files may be deleted or modified during this process, please back up your data before
                    continuing.
                </strong>
            </p>
            <div className={`mt-6 text-right`}>
                <ActionButton variant='danger' onClick={() => setModalVisible(true)}>
                    Reinstall Server
                </ActionButton>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
