// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';

import asDialog from '@/hoc/asDialog';

import disableAccountTwoFactor from '@/api/account/disableAccountTwoFactor';

import { useStoreActions } from '@/state/hooks';

import { useFlashKey } from '@/plugins/useFlash';

const DisableTOTPDialog = () => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const { close, setProps } = useContext(DialogWrapperContext);
    const updateUserData = useStoreActions((actions) => actions.user.updateUserData);

    useEffect(() => {
        setProps({
            title: t('settings.2fa.disable.title'),
            description: t('settings.2fa.disable.description'),
            preventExternalClose: submitting,
        });
    }, [submitting, t]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        disableAccountTwoFactor(password)
            .then(() => {
                updateUserData({ useTotp: false });
                close();
            })
            .catch(clearAndAddHttpError)
            .then(() => setSubmitting(false));
    };

    return (
        <form id={'disable-totp-form'} className={'mt-6'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <label className={'block pb-1'} htmlFor={'totp-password'}>
                {t('account_password')}
            </label>
            <Input.Text
                id={'totp-password'}
                type={'password'}
                variant={Input.Text.Variants.Loose}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <ActionButton variant='secondary' onClick={close}>
                    {t('cancel')}
                </ActionButton>
                <ActionButton
                    variant='danger'
                    type={'submit'}
                    form={'disable-totp-form'}
                    disabled={submitting || !password.length}
                >
                    {t('settings.2fa.buttons.disable')}
                </ActionButton>
            </Dialog.Footer>
        </form>
    );
};

// Export with empty initial props since we set them dynamically in the component
export default asDialog()(DisableTOTPDialog);
