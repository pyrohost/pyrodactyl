import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';

import { Button } from '@/components/elements/button/index';

import asModal from '@/hoc/asModal';

type Props = {
    title: string;
    buttonText: string;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
    children: React.ReactNode;
};

const ConfirmationModal: React.FC<Props> = ({ children, buttonText, onConfirmed }) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <div className='flex flex-col w-full'>
                <div className={`text-zinc-300`}>{children}</div>
                <div className={`flex gap-4 items-center justify-end my-6`}>
                    <Button.Text onClick={() => dismiss()}>Cancel</Button.Text>
                    <Button onClick={() => onConfirmed()}>{buttonText}</Button>
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
