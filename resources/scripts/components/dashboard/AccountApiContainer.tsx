import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { type Actions, useStoreActions } from 'easy-peasy';
import { type FormikHelpers } from 'formik';
import { lazy, useEffect, useState } from 'react';
import createApiKey from '@/api/account/createApiKey';
import deleteApiKey from '@/api/account/deleteApiKey';
import getApiKeys, { type ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

import ServerHeader from '../HeaderManger';


const CreateApiKeyModal = lazy(() => import('./CreateApiKeyModal'));

interface CreateValues {
    description: string;
    allowedIps: string;
}

const AccountApiContainer = () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('api-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

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

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:api-keys');
        createApiKey(values.description, values.allowedIps)
            .then(({ secretToken, ...key }) => {
                resetForm();
                setSubmitting(false);
                setApiKey(`${key.identifier}${secretToken}`);
                setKeys((s) => [...s!, key]);
                setShowCreateModal(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account:api-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (identifier: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [identifier]: !prev[identifier],
        }));
    };

    return (
        <PageContentBlock title={'Api Key'}>
            <FlashMessageRender byKey='account:api-keys' />
            <ApiKeyModal visible={apiKey.length > 0} onModalDismissed={() => setApiKey('')} apiKey={apiKey} />
            <ServerHeader title='Api Keys' />

            <CreateApiKeyModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={submitCreate}
            />

            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4 w-full'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <ActionButton
                        variant='secondary'
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2'
                    >
                        <Plus width={22} height={22} fill='currentColor' />
                        Create API Key
                    </ActionButton>
                </div>

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='bg-mocha-500 border-[1px] border-[#ffffff12] hover:border-[#ffffff15] rounded-xl p-4 sm:p-6 shadow-sm'>
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
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-mocha-400 flex items-center justify-center'>
                                    <Key width={22} height={22} className='text-zinc-400' fill='currentColor' />
                                </div>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>No API Keys</h3>
                                <p className='text-sm text-zinc-400 max-w-sm mx-auto'>
                                    {loading
                                        ? 'Loading your API keys...'
                                        : "You haven't created any API keys yet. Create one to get started with the API."}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {keys.map((key, index) => (
                                    <div
                                        key={key.identifier}
                                        className='transform-gpu skeleton-anim-2'
                                        style={{
                                            animationDelay: `${index * 25 + 100}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <div className='rounded-lg transition-all duration-150'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <h4 className='text-sm font-medium text-zinc-100 truncate'>
                                                            {key.description}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 text-xs text-zinc-400'>
                                                        <span>
                                                            Last used:{' '}
                                                            {key.lastUsedAt
                                                                ? format(key.lastUsedAt, 'MMM d, yyyy HH:mm')
                                                                : 'Never'}
                                                        </span>
                                                        <div className='flex items-center gap-2'>
                                                            <span>Key:</span>
                                                            <code className='font-mono px-2 py-1 bg-mocha-400 border border-mocha-200 rounded text-zinc-300'>
                                                                {showKeys[key.identifier]
                                                                    ? key.identifier
                                                                    : '••••••••••••••••'}
                                                            </code>
                                                            <ActionButton
                                                                variant='secondary'
                                                                size='sm'
                                                                onClick={() => toggleKeyVisibility(key.identifier)}
                                                                className='p-1 text-zinc-400 hover:text-zinc-300'
                                                            >
                                                                {showKeys[key.identifier] ? (
                                                                    <EyeSlash
                                                                        width={18}
                                                                        height={18}
                                                                        fill='currentColor'
                                                                    />
                                                                ) : (
                                                                    <Eye width={18} height={18} fill='currentColor' />
                                                                )}
                                                            </ActionButton>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    variant='danger'
                                                    size='sm'
                                                    className='ml-4'
                                                    onClick={() => setDeleteIdentifier(key.identifier)}
                                                >
                                                    <TrashBin width={20} height={20} fill='currentColor' />
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountApiContainer;
