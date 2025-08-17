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
import BackupRow from '@/components/server/backups/BackupRow';

import createServerBackup from '@/api/server/backups/createServerBackup';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

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
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating, mutate } = getServerBackups();
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    const hasBackupsInProgress = backups?.items.some((backup) => backup.completedAt === null) || false;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (hasBackupsInProgress) {
            interval = setInterval(() => {
                mutate();
            }, 2000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [hasBackupsInProgress, mutate]);

    useEffect(() => {
        clearFlashes('backups:create');
    }, [createModalVisible]);

    const submitBackup = (values: BackupValues, { setSubmitting }: FormikHelpers<BackupValues>) => {
        clearFlashes('backups:create');
        createServerBackup(uuid, values)
            .then(async (backup) => {
                await mutate(
                    (data) => ({ ...data!, items: data!.items.concat(backup), backupCount: data!.backupCount + 1 }),
                    false,
                );
                setSubmitting(false);
                setCreateModalVisible(false);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups:create', error });
                setSubmitting(false);
            });
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
                            {backupLimit > 0 && (
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {backups.backupCount} of {backupLimit} backups
                                </p>
                            )}
                            {backupLimit > 0 && backupLimit > backups.backupCount && (
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

            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
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
                                    {backupLimit > 0 ? 'No backups found' : 'Backups unavailable'}
                                </h3>
                                <p className='text-sm text-zinc-400 max-w-sm'>
                                    {backupLimit > 0
                                        ? 'Your server does not have any backups. Create one to get started.'
                                        : 'Backups cannot be created for this server.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <PageListContainer>
                            {items.map((backup) => (
                                <BackupRow key={backup.uuid} backup={backup} />
                            ))}
                        </PageListContainer>
                    )
                }
            </Pagination>
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
