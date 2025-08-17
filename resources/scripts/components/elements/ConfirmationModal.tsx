import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';

import ActionButton from '@/components/elements/ActionButton';

import asModal from '@/hoc/asModal';

type Props = {
    title: string;
    buttonText: string;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
};

const ConfirmationModal: React.FC<Props> = ({ children, buttonText, onConfirmed, disabled }) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <div className='flex flex-col w-full'>
                <div className={`text-zinc-300`}>{children}</div>
                <div className={`flex gap-4 items-center justify-end my-6`}>
                    <ActionButton variant='secondary' onClick={() => dismiss()}>
                        Cancel
                    </ActionButton>
                    <ActionButton onClick={() => onConfirmed()} disabled={disabled}>
                        {buttonText}
                    </ActionButton>
                </div>
            </div>
        </>
    );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export default asModal<Props>((props) => ({
    title: props.title,
    showSpinnerOverlay: props.showSpinnerOverlay,
}))(ConfirmationModal);
