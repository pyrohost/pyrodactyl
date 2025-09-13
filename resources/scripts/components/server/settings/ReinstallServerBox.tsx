import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: t('server.settings.reinstall.toast.reinstall_started'),
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
        <TitledGreyBox title={t('server.settings.reinstall.title')}>
            <Dialog.Confirm
                open={modalVisible}
                title={t('server.settings.reinstall.confirm.title')}
                confirm={t('server.settings.reinstall.confirm.confirm')}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                {t('server.settings.reinstall.confirm.description')}
            </Dialog.Confirm>
            <p className={`text-sm`}>
                <Trans i18nKey={'server.settings.reinstall.description'}>
                    Reinstalling your server will stop it, and then re-run the installation script that initially set it
                    up.&nbsp;
                    <strong className={`font-medium`}>
                        Some files may be deleted or modified during this process, please back up your data before
                        continuing.
                    </strong>
                </Trans>
            </p>
            <div className={`mt-6 text-right`}>
                <ActionButton variant='danger' onClick={() => setModalVisible(true)}>
                    {t('server.settings.reinstall.button')}
                </ActionButton>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
