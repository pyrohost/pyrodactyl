import { useContext } from 'react';
import Button from '@/components/elements/Button';
import asModal from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';

type Props = {
    title: string;
    buttonText: string;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
};

const ConfirmationModal: React.FC<Props> = ({ title, children, buttonText, onConfirmed }) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <h2 className={`text-2xl mb-6`}>{title}</h2>
            <div className={`text-zinc-300`}>{children}</div>
            <div className={`flex flex-wrap items-center justify-end mt-8`}>
                <Button isSecondary onClick={() => dismiss()}>
                    Cancel
                </Button>
                <Button color={'red'} onClick={() => onConfirmed()}>
                    {buttonText}
                </Button>
            </div>
        </>
    );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export default asModal<Props>((props) => ({
    showSpinnerOverlay: props.showSpinnerOverlay,
}))(ConfirmationModal);
