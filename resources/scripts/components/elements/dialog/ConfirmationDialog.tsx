import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';

import { Dialog, RenderDialogProps } from './';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    loading?: boolean;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const ConfirmationDialog = ({ confirm = 'Okay', children, onConfirmed, loading, ...props }: ConfirmationProps) => {
    return (
        <Dialog {...props} description={typeof children === 'string' ? children : undefined}>
            {typeof children !== 'string' && children}
            <Dialog.Footer>
                <ActionButton variant='secondary' onClick={props.onClose}>
                    Cancel
                </ActionButton>
                <ActionButton variant='danger' onClick={onConfirmed} disabled={loading}>
                    <div className='flex items-center gap-2'>
                        {loading && <Spinner size='small' />}
                        <span>{confirm}</span>
                    </div>
                </ActionButton>
            </Dialog.Footer>
        </Dialog>
    );
};

export default ConfirmationDialog;
