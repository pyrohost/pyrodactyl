import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
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
            <FlashMessageRender byKey={'account'} />
            <div className={`md:flex flex-nowrap my-10`}>
                <ContentBox title={'Create API Key'} className={`flex-none w-full md:w-1/2`}>
                    <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                </ContentBox>
                <ContentBox title={'API Keys'} className={`flex-1 overflow-hidden mt-8 md:mt-0 md:ml-8`}>
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
                        <p className={`text-center text-sm`}>
                            {loading ? 'Loading...' : 'No API keys exist for this account.'}
                        </p>
                    ) : (
                        keys.map((key, _) => (
                            <div className='flex flex-col' key={key.identifier}>
                                {/* <FontAwesomeIcon icon={faKey} className={`text-zinc-300`} /> */}
                                <div className={`ml-4 flex-1 overflow-hidden`}>
                                    <p className={`text-sm break-words`}>{key.description}</p>
                                    <p className={`text-xs text-zinc-300 uppercase`}>
                                        Last used:&nbsp;
                                        {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : 'Never'}
                                    </p>
                                </div>
                                <p className={`text-sm ml-4 hidden md:block`}>
                                    <code className={`font-mono py-1 px-2 bg-zinc-900 rounded`}>{key.identifier}</code>
                                </p>
                                <button
                                    className={`ml-4 p-2 text-sm`}
                                    onClick={() => setDeleteIdentifier(key.identifier)}
                                >
                                    {/* <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className={`text-zinc-400 hover:text-red-400 transition-colors duration-150`}
                                    /> */}
                                    FIXME: Delete Icon
                                </button>
                            </div>
                        ))
                    )}
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
