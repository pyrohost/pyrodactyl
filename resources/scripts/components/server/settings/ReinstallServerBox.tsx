import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { t } = useTranslation();

    const reinstall = () => {
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
            .then(() => setModalVisible(false));
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
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    {t('server.settings.reinstall.button')}
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};
