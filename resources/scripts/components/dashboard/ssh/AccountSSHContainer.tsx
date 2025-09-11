import { format } from 'date-fns';
import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsEye from '@/components/elements/hugeicons/Eye';
import HugeIconsEyeSlash from '@/components/elements/hugeicons/EyeSlash';
import HugeIconsKey from '@/components/elements/hugeicons/Key';
import HugeIconsPlus from '@/components/elements/hugeicons/Plus';
import HugeIconsTrash from '@/components/elements/hugeicons/Trash';

import { createSSHKey, deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

import { useFlashKey } from '@/plugins/useFlash';

interface CreateValues {
    name: string;
    publicKey: string;
}

const AccountSSHContainer = () => {
    const [deleteKey, setDeleteKey] = useState<{ name: string; fingerprint: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('account:ssh-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { data, isValidating, error, mutate } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const doDeletion = () => {
        if (!deleteKey) return;

        clearAndAddHttpError();
        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== deleteKey.fingerprint), false),
            deleteSSHKey(deleteKey.fingerprint),
        ])
            .catch((error) => {
                mutate(undefined, true).catch(console.error);
                clearAndAddHttpError(error);
            })
            .finally(() => {
                setDeleteKey(null);
            });
    };

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                mutate((data) => (data || []).concat(key));
                setShowCreateModal(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account:ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (fingerprint: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [fingerprint]: !prev[fingerprint],
        }));
    };

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey='account:ssh-keys' />

            {/* Create SSH Key Modal */}
            {showCreateModal && (
                <Dialog.Confirm
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title='Add SSH Key'
                    confirm='Add Key'
                    onConfirmed={() => {
                        const form = document.getElementById('create-ssh-form') as HTMLFormElement;
                        if (form) {
                            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                            if (submitButton) submitButton.click();
                        }
                    }}
                >
                    <Formik
                        onSubmit={submitCreate}
                        initialValues={{ name: '', publicKey: '' }}
                        validationSchema={object().shape({
                            name: string().required('SSH Key Name is required'),
                            publicKey: string().required('Public Key is required'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <Form id='create-ssh-form' className='space-y-4'>
                                <SpinnerOverlay visible={isSubmitting} />

                                <FormikFieldWrapper
                                    label='SSH Key Name'
                                    name='name'
                                    description='A name to identify this SSH key.'
                                >
                                    <Field name='name' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <FormikFieldWrapper
                                    label='Public Key'
                                    name='publicKey'
                                    description='Enter your public SSH key.'
                                >
                                    <Field name='publicKey' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <button type='submit' className='hidden' />
                            </Form>
                        )}
                    </Formik>
                </Dialog.Confirm>
            )}

            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader
                        title='SSH Keys'
                        titleChildren={
                            <ActionButton
                                variant='primary'
                                onClick={() => setShowCreateModal(true)}
                                className='flex items-center gap-2'
                            >
                                <HugeIconsPlus className='w-4 h-4' fill='currentColor' />
                                Add SSH Key
                            </ActionButton>
                        }
                    />
                </div>

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 sm:p-6 shadow-sm'>
                        <SpinnerOverlay visible={!data && isValidating} />
                        <Dialog.Confirm
                            title={'Delete SSH Key'}
                            confirm={'Delete Key'}
                            open={!!deleteKey}
                            onClose={() => setDeleteKey(null)}
                            onConfirmed={doDeletion}
                        >
                            Removing the <Code>{deleteKey?.name}</Code> SSH key will invalidate its usage across the
                            Panel.
                        </Dialog.Confirm>

                        {!data || data.length === 0 ? (
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                    <HugeIconsKey className='w-8 h-8 text-zinc-400' fill='currentColor' />
                                </div>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>No SSH Keys</h3>
                                <p className='text-sm text-zinc-400 max-w-sm mx-auto'>
                                    {!data
                                        ? 'Loading your SSH keys...'
                                        : "You haven't added any SSH keys yet. Add one to securely access your servers."}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {data.map((key, index) => (
                                    <div
                                        key={key.fingerprint}
                                        className='transform-gpu skeleton-anim-2'
                                        style={{
                                            animationDelay: `${index * 25 + 100}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <div className='bg-[#ffffff05] border-[1px] border-[#ffffff08] rounded-lg p-4 hover:border-[#ffffff15] transition-all duration-150'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <h4 className='text-sm font-medium text-zinc-100 truncate'>
                                                            {key.name}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 text-xs text-zinc-400'>
                                                        <span>Added: {format(key.createdAt, 'MMM d, yyyy HH:mm')}</span>
                                                        <div className='flex items-center gap-2'>
                                                            <span>Fingerprint:</span>
                                                            <code className='font-mono px-2 py-1 bg-[#ffffff08] border border-[#ffffff08] rounded text-zinc-300'>
                                                                {showKeys[key.fingerprint]
                                                                    ? `SHA256:${key.fingerprint}`
                                                                    : 'SHA256:••••••••••••••••'}
                                                            </code>
                                                            <ActionButton
                                                                variant='secondary'
                                                                size='sm'
                                                                onClick={() => toggleKeyVisibility(key.fingerprint)}
                                                                className='p-1 text-zinc-400 hover:text-zinc-300'
                                                            >
                                                                {showKeys[key.fingerprint] ? (
                                                                    <HugeIconsEyeSlash
                                                                        className='w-3 h-3'
                                                                        fill='currentColor'
                                                                    />
                                                                ) : (
                                                                    <HugeIconsEye
                                                                        className='w-3 h-3'
                                                                        fill='currentColor'
                                                                    />
                                                                )}
                                                            </ActionButton>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    variant='danger'
                                                    size='sm'
                                                    className='ml-4'
                                                    onClick={() =>
                                                        setDeleteKey({ name: key.name, fingerprint: key.fingerprint })
                                                    }
                                                >
                                                    <HugeIconsTrash className='w-4 h-4' fill='currentColor' />
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

export default AccountSSHContainer;
