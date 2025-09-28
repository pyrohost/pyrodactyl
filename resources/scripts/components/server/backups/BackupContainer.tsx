import { Form, Formik, Field as FormikField, FormikHelpers, useFormikContext } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { boolean, object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import Pagination from '@/components/elements/Pagination';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { PageListContainer } from '@/components/elements/pages/PageList';

import { Context as ServerBackupContext } from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';
import { useUnifiedBackups } from './useUnifiedBackups';
import BackupItem from './BackupItem';

// Helper function to format storage values
const formatStorage = (mb: number | undefined | null): string => {
    if (mb === null || mb === undefined) {
        return '0MB';
    }
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
};

interface BackupValues {
    name: string;
    ignored: string;
    isLocked: boolean;
}

const ModalContent = ({ ...props }: RequiredModalProps) => {
    const { isSubmitting } = useFormikContext<BackupValues>();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting} title='Create server backup'>
            <Form>
                <FlashMessageRender byKey={'backups:create'} />
                <Field
                    name={'name'}
                    label={'Backup name'}
                    description={'If provided, the name that should be used to reference this backup.'}
                />
                <div className={`mt-6 flex flex-col`}>
                    <FormikFieldWrapper
                        className='flex flex-col gap-2'
                        name={'ignored'}
                        label={'Ignored Files & Directories'}
                        description={`
                            Enter the files or folders to ignore while generating this backup. Leave blank to use
                            the contents of the .pteroignore file in the root of the server directory if present.
                            Wildcard matching of files and folders is supported in addition to negating a rule by
                            prefixing the path with an exclamation point.
                        `}
                    >
                        <FormikField
                            as={Textarea}
                            className='px-4 py-2 rounded-lg outline-hidden bg-[#ffffff17] text-sm'
                            name={'ignored'}
                            rows={6}
                        />
                    </FormikFieldWrapper>
                </div>
                <Can action={'backup.delete'}>
                    <div className={`my-6`}>
                        <FormikSwitchV2
                            name={'isLocked'}
                            label={'Locked'}
                            description={'Prevents this backup from being deleted until explicitly unlocked.'}
                        />
                    </div>
                </Can>
                <div className={`flex justify-end mb-6`}>
                    <ActionButton variant='primary' type={'submit'} disabled={isSubmitting}>
                        {isSubmitting && <Spinner size='small' />}
                        {isSubmitting ? 'Creating backup...' : 'Start backup'}
                    </ActionButton>
                </div>
            </Form>
        </Modal>
    );
};

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const {
        backups,
        backupCount,
        storage,
        error,
        isValidating,
        createBackup
    } = useUnifiedBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);
    const backupStorageLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backupStorageMb);

    useEffect(() => {
        clearFlashes('backups:create');
    }, [createModalVisible]);

    const submitBackup = async (values: BackupValues, { setSubmitting }: FormikHelpers<BackupValues>) => {
        clearFlashes('backups:create');

        try {
            await createBackup(values.name, values.ignored, values.isLocked);

            // Clear any existing flash messages
            clearFlashes('backups');
            clearFlashes('backups:create');

            setSubmitting(false);
            setCreateModalVisible(false);
        } catch (error) {
            clearAndAddHttpError({ key: 'backups:create', error });
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');
            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return (
            <ServerContentBlock title={'Backups'}>
                <FlashMessageRender byKey={'backups'} />
                <MainPageHeader direction='column' title={'Backups'}>
                    <p className='text-sm text-neutral-400 leading-relaxed'>
                        Create and manage server backups to protect your data. Schedule automated backups, download
                        existing ones, and restore when needed.
                    </p>
                </MainPageHeader>
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <FlashMessageRender byKey={'backups'} />
            <MainPageHeader
                direction='column'
                title={'Backups'}
                titleChildren={
                    <Can action={'backup.create'}>
                        <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                            <div className='flex flex-col gap-1 text-center sm:text-right'>
                                {/* Backup Count Display */}
                                {backupLimit === null && (
                                    <p className='text-sm text-zinc-300'>
                                        {backupCount} backups
                                    </p>
                                )}
                                {backupLimit > 0 && (
                                    <p className='text-sm text-zinc-300'>
                                        {backupCount} of {backupLimit} backups
                                    </p>
                                )}
                                {backupLimit === 0 && (
                                    <p className='text-sm text-red-400'>
                                        Backups disabled
                                    </p>
                                )}

                                {/* Storage Usage Display */}
                                {storage && (
                                    <div className='flex flex-col gap-0.5'>
                                        {backupStorageLimit === null ? (
                                            <p
                                                className='text-sm text-zinc-300 cursor-help'
                                                title={`${storage.used_mb?.toFixed(2) || 0}MB used(No Limit)`}
                                            >
                                                <span className='font-medium'>{formatStorage(storage.used_mb)}</span> storage used
                                            </p>
                                        ) : (
                                            <>
                                                <p
                                                    className='text-sm text-zinc-300 cursor-help'
                                                    title={`${storage.used_mb?.toFixed(2) || 0}MB used of ${backupStorageLimit}MB (${storage.available_mb?.toFixed(2) || 0}MB Available)`}
                                                >
                                                    <span className='font-medium'>{formatStorage(storage.used_mb)}</span> {' '}
                                                    {backupStorageLimit === null ?
                                                        "used" :
                                                        (<span className='font-medium'>of {formatStorage(backupStorageLimit)} used</span>)}
                                                </p>

                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {(backupLimit === null || backupLimit > backupCount) &&
                                (!backupStorageLimit || !storage?.is_over_limit) && (
                                    <ActionButton variant='primary' onClick={() => setCreateModalVisible(true)}>
                                        New Backup
                                    </ActionButton>
                                )}
                        </div>
                    </Can>
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Create and manage server backups to protect your data. Schedule automated backups, download existing
                    ones, and restore when needed.
                </p>
            </MainPageHeader>

            {createModalVisible && (
                <Formik
                    onSubmit={submitBackup}
                    initialValues={{ name: '', ignored: '', isLocked: false }}
                    validationSchema={object().shape({
                        name: string().max(191),
                        ignored: string(),
                        isLocked: boolean(),
                    })}
                >
                    <ModalContent visible={createModalVisible} onDismissed={() => setCreateModalVisible(false)} />
                </Formik>
            )}

            {backups.length === 0 ? (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <svg className='w-8 h-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    fillRule='evenodd'
                                    d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {backupLimit === 0 ? 'Backups unavailable' : 'No backups found'}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {backupLimit === 0
                                ? 'Backups cannot be created for this server.'
                                : 'Your server does not have any backups. Create one to get started.'}
                        </p>
                    </div>
                </div>
            ) : (
                <PageListContainer>
                    {backups.map((backup) => (
                        <BackupItem key={backup.uuid} backup={backup} />
                    ))}
                </PageListContainer>
            )}
        </ServerContentBlock>
    );
};

const BackupContainerWrapper = () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};

export default BackupContainerWrapper;