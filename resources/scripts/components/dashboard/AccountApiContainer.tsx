import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import Button from '@/components/elements/Button';
import Code from '@/components/elements/Code';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import deleteApiKey from '@/api/account/deleteApiKey';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';

import { useFlashKey } from '@/plugins/useFlash';

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <PageContentBlock title={'Account API'}>
            {/* Flash messages will now appear at the top of the page */}
            <FlashMessageRender byKey='account' />
            <div className='md:flex flex-nowrap my-10 space-x-8'>
                <ContentBox title={'Create API Key'} className='flex-none w-full md:w-1/1'>
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </ContentBox>
            </div>
            <ContentBox title={'API Keys'}>
                <SpinnerOverlay visible={loading} />
                <Dialog.Confirm
                    title={'Delete API Key'}
                    confirm={'Delete Key'}
                    open={!!deleteIdentifier}
                    onClose={() => setDeleteIdentifier('')}
                    onConfirmed={() => doDeletion(deleteIdentifier)}
                >
                    All requests using the <Code>{deleteIdentifier}</Code> key will be invalidated.
                </Dialog.Confirm>

                {keys.length === 0 ? (
                    <p className='text-center text-sm text-gray-500'>
                        {loading ? 'Loading...' : 'No API keys exist for this account.'}
                    </p>
                ) : (
                    keys.map((key) => (
                        <div key={key.identifier} className='flex flex-col mb-6 space-y-4'>
                            <div className='flex items-center justify-between space-x-4 border border-gray-300 rounded-lg p-4 transition duration-200'>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium'>{key.description}</p>
                                    <p className='text-xs text-gray-500 uppercase'>
                                        Last used:{' '}
                                        {key.lastUsedAt ? format(key.lastUsedAt, 'MMM d, yyyy HH:mm') : 'Never'}
                                    </p>
                                </div>
                                <p className='text-sm text-gray-600 hidden md:block'>
                                    <code className='font-mono py-1 px-2 bg-gray-800 rounded-sm text-white'>
                                        {key.identifier}
                                    </code>
                                </p>
                                <Button
                                    className='p-2 text-red-500 hover:text-red-700'
                                    onClick={() => setDeleteIdentifier(key.identifier)}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} size='lg' />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </ContentBox>
        </PageContentBlock>
    );
};
