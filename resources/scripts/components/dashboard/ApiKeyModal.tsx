import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Button from '@/components/elements/Button';
import CopyOnClick from '@/components/elements/CopyOnClick';

import asModal from '@/hoc/asModal';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <div className='p-6 space-y-6 max-w-lg mx-auto rounded-lg shadow-lg'>
            {/* Flash message section */}
            <FlashMessageRender byKey='account' />

            {/* Modal Header */}
            <p className='text-sm text-white-600 mt-2'>
                The API key you have requested is shown below. Please store it in a safe place, as it will not be shown
                again.
            </p>

            {/* API Key Display Section */}
            <div className='relative mt-6'>
                <pre className='bg-gray-900 text-white p-4 rounded-lg font-mono overflow-x-auto'>
                    <CopyOnClick text={apiKey}>
                        <code className='text-sm break-words'>{apiKey}</code>
                    </CopyOnClick>

                    {/* Copy button with icon */}
                    <div className='absolute top-2 right-2'></div>
                </pre>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-4'>
                <Button
                    type='button'
                    onClick={() => dismiss()}
                    className='bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-500 cursor-pointer'
                >
                    Close
                </Button>
            </div>
        </div>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    title: 'Your API Key',
    closeOnEscape: true, // Allows closing the modal by pressing Escape
    closeOnBackground: true, // Allows closing by clicking outside the modal
})(ApiKeyModal);
