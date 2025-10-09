import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Alert } from '@/components/elements/alert';
import { Dialog, DialogProps } from '@/components/elements/dialog';

interface RecoveryTokenDialogProps extends DialogProps {
    tokens: string[];
}

const RecoveryTokensDialog = ({ tokens, open, onClose }: RecoveryTokenDialogProps) => {
    const grouped = [] as [string, string][];
    tokens.forEach((token, index) => {
        if (index % 2 === 0) {
            grouped.push([token, tokens[index + 1] || '']);
        }
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={'Autenticación 2-FA habilitada'}
            description={
                'Guarda los siguientes códigos en un sitio seguro. Si pierdes el acceso a tu aplicación de autenticación, podrás usar estos códigos para iniciar sesión sin ella.'
            }
            hideCloseIcon
            preventExternalClose
        >
            <Dialog.Icon position={'container'} type={'success'} />
            <CopyOnClick text={tokens.join('\n')} showInNotification={false}>
                <pre className={'bg-zinc-800 rounded-sm p-2 mt-6'}>
                    {grouped.map((value) => (
                        <span key={value.join('_')} className={'block'}>
                            {value[0]}
                            <span className={'mx-2 selection:bg-zinc-800'}>&nbsp;</span>
                            {value[1]}
                            <span className={'selection:bg-zinc-800'}>&nbsp;</span>
                        </span>
                    ))}
                </pre>
            </CopyOnClick>
            <Alert type={'danger'} className={'mt-3'}>
                Estos códigos no se volverán a mostrar.
            </Alert>
            <Dialog.Footer>
                <ActionButton variant='primary' onClick={onClose}>
                    Hecho
                </ActionButton>
            </Dialog.Footer>
        </Dialog>
    );
};

export default RecoveryTokensDialog;
