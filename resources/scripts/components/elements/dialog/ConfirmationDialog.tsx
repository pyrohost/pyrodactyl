import ActionButton from '@/components/elements/ActionButton';

import { Dialog, RenderDialogProps } from './';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const ConfirmationDialog = ({ confirm = 'Okay', children, onConfirmed, ...props }: ConfirmationProps) => {
    return (
        <Dialog {...props} description={typeof children === 'string' ? children : undefined}>
            {typeof children !== 'string' && children}
            <Dialog.Footer>
                <ActionButton variant="secondary" onClick={props.onClose}>Cancel</ActionButton>
                <ActionButton variant="danger" onClick={onConfirmed}>{confirm}</ActionButton>
            </Dialog.Footer>
        </Dialog>
    );
};

export default ConfirmationDialog;
