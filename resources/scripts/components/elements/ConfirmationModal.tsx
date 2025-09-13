import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation(); // Only keep this one
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <div className='flex flex-col w-full'>
                <div className={`text-zinc-300`}>{children}</div>
                <div className={`flex gap-4 items-center justify-end my-6`}>
                    <ActionButton variant='secondary' onClick={() => dismiss()}>
                        {t('cancel')}
                    </ActionButton>
                    <ActionButton onClick={() => onConfirmed()} disabled={disabled}>
                        {buttonText}
                    </ActionButton>
                </div>
            </div>
        </>
    );
};

// For the displayName, you can either use a static string or create a wrapper component
ConfirmationModal.displayName = 'ConfirmationModal';

// Create a wrapper component to handle the modal with translations if needed
const ConfirmationModalWrapper = (props: Props) => {
    return <ConfirmationModal {...props} />;
};

export default asModal<Props>((props) => ({
    title: props.title,
    showSpinnerOverlay: props.showSpinnerOverlay,
}))(ConfirmationModalWrapper);
