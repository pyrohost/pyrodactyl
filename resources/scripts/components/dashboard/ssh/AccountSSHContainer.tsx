import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import Code from '@/components/elements/Code';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import { useSSHKeys } from '@/api/account/ssh-keys';

import { useFlashKey } from '@/plugins/useFlash';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const doDeletion = (fingerprint: string) => {
        setDeleteIdentifier(fingerprint);
        // Implement the deletion logic for SSH key here
    };

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey={'account'} />
            <div className="md:flex flex-nowrap my-10 space-x-8">
                {/* Create SSH Key Section */}
                <ContentBox title={'Add SSH Key'} className="flex-none w-full md:w-1/2">
                    <CreateSSHKeyForm />
                </ContentBox>

                {/* SSH Keys List Section */}
                <ContentBox title={'SSH Keys'} className="flex-1 overflow-hidden mt-8 md:mt-0">
                    <SpinnerOverlay visible={!data && isValidating} />
                    <Dialog.Confirm
                        title={'Delete SSH Key'}
                        confirm={'Delete Key'}
                        open={!!deleteIdentifier}
                        onClose={() => setDeleteIdentifier('')}
                        onConfirmed={() => doDeletion(deleteIdentifier)}
                    >
                        Deleting this key will revoke access for any system using it.
                    </Dialog.Confirm>
                    {!data || data.length === 0 ? (
                        <p className="text-center text-sm text-gray-500">
                            {!data ? 'Loading...' : 'No SSH keys exist for this account.'}
                        </p>
                    ) : (
                        data.map((key) => (
                            <div key={key.fingerprint} className="flex flex-col mb-6 space-y-4">
                                <div className="flex items-center justify-between space-x-4 border border-gray-300 rounded-lg p-4 transition duration-200">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{key.name}</p>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Added on: {format(key.createdAt, 'MMM d, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 hidden md:block">
                                        <code className="font-mono py-1 px-2 bg-gray-800 rounded text-white">
                                            SHA256: {key.fingerprint}
                                        </code>
                                    </p>
                                    <button
                                        className="p-2 text-red-500 hover:text-red-700"
                                        onClick={() => setDeleteIdentifier(key.fingerprint)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} size="lg" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
