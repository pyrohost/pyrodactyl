import { useTranslation } from 'react-i18next';

import { Button } from '@/components/elements/button/index';

import { Dialog, RenderDialogProps } from './';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default ({ confirm, children, onConfirmed, ...props }: ConfirmationProps) => {
    const { t } = useTranslation();
    const confirmText = confirm || t('ok');

    return (
        <Dialog {...props} description={typeof children === 'string' ? children : undefined}>
            {typeof children !== 'string' && children}
            <Dialog.Footer>
                <Button.Text onClick={props.onClose}>{t('cancel')}</Button.Text>
                <Button.Danger onClick={onConfirmed}>{confirmText}</Button.Danger>
            </Dialog.Footer>
        </Dialog>
    );
};
