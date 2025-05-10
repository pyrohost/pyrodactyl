import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';
import Code from '@/components/elements/Code';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import { useSSHKeys } from '@/api/account/ssh-keys';

import { useFlashKey } from '@/plugins/useFlash';

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

    const doDeletion = (fingerprint: string) => {};

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey={'account'} />
            <div className='md:flex flex-nowrap my-10 space-x-8'>
                {/* Create SSH Key Section */}
                <ContentBox title={'Add SSH Key'} className='flex-none w-full md:w-1/1'>
                    <CreateSSHKeyForm />
                </ContentBox>
            </div>
            {/* SSH Keys List Section */}
            <ContentBox title={'SSH Keys'}>
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
                    <p className='text-center text-sm text-gray-500'>
                        {!data ? 'Loading...' : 'No SSH keys exist for this account.'}
                    </p>
                ) : (
                    data.map((key) => (
                        <div key={key.fingerprint} className='flex flex-col mb-6 space-y-4'>
                            <div className='flex items-center justify-between space-x-4 border border-gray-300 rounded-lg p-4 transition duration-200'>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium'>{key.name}</p>
                                    <p className='text-xs text-gray-500 uppercase'>
                                        Added on: {format(key.createdAt, 'MMM d, yyyy HH:mm')}
                                    </p>
                                </div>
                                <p className='text-sm text-gray-600 hidden md:block'>
                                    <code className='font-mono py-1 px-2 bg-gray-800 rounded-sm text-white'>
                                        SHA256: {key.fingerprint}
                                    </code>
                                </p>
                                <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                            </div>
                        </div>
                    ))
                )}
            </ContentBox>
        </PageContentBlock>
    );
};
