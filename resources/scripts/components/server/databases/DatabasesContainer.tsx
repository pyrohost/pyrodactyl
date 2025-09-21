import { Form, Formik, FormikHelpers } from 'formik';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Modal from '@/components/elements/Modal';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import { PageListContainer, PageListItem } from '@/components/elements/pages/PageList';
import DatabaseRow from '@/components/server/databases/DatabaseRow';

import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import getServerDatabases from '@/api/server/databases/getServerDatabases';

import { ServerContext } from '@/state/server';

import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';

interface DatabaseValues {
    databaseName: string;
    connectionsFrom: string;
}

const databaseSchema = object().shape({
    databaseName: string()
        .required('A database name must be provided.')
        .min(3, 'Database name must be at least 3 characters.')
        .max(48, 'Database name must not exceed 48 characters.')
        .matches(
            /^[\w\-.]{3,48}$/,
            'Database name should only contain alphanumeric characters, underscores, dashes, and/or periods.',
        ),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, 'A valid host address must be provided.'),
});

const DatabasesContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const submitDatabase = (values: DatabaseValues, { setSubmitting, resetForm }: FormikHelpers<DatabaseValues>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                resetForm();
                appendDatabase(database);
                setSubmitting(false);
                setCreateModalVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Databases'}>
            <FlashMessageRender byKey={'databases'} />
            <MainPageHeader
                direction='column'
                title={'Databases'}
                titleChildren={
                    <Can action={'database.create'}>
                        <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                            {databaseLimit === null && (
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {databases.length} databases (unlimited)
                                </p>
                            )}
                            {databaseLimit > 0 && (
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {databases.length} of {databaseLimit} databases
                                </p>
                            )}
                            {databaseLimit === 0 && (
                                <p className='text-sm text-red-400 text-center sm:text-right'>
                                    Databases disabled
                                </p>
                            )}
                            {(databaseLimit === null || (databaseLimit > 0 && databaseLimit !== databases.length)) && (
                                <ActionButton variant='primary' onClick={() => setCreateModalVisible(true)}>
                                    New Database
                                </ActionButton>
                            )}
                        </div>
                    </Can>
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Create and manage MySQL databases for your server. Configure database access, manage users, and view
                    connection details.
                </p>
            </MainPageHeader>

            <Formik
                onSubmit={submitDatabase}
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                validationSchema={databaseSchema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={createModalVisible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setCreateModalVisible(false);
                        }}
                        title='Create new database'
                    >
                        <div className='flex flex-col'>
                            <FlashMessageRender byKey={'database:create'} />
                            <Form>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={'Database Name'}
                                    description={'A descriptive name for your database instance.'}
                                />
                                <div className={`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={'Connections From'}
                                        description={
                                            'Where connections should be allowed from. Leave blank to allow connections from anywhere.'
                                        }
                                    />
                                </div>
                                <div className={`flex gap-3 justify-end my-6`}>
                                    <ActionButton variant='primary' type={'submit'}>
                                        Create Database
                                    </ActionButton>
                                </div>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : databases.length > 0 ? (
                <PageListContainer data-pyro-databases>
                    <For each={databases} memo>
                        {(database, index) => <DatabaseRow key={database.id} database={database} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <HugeIconsDatabase className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {databaseLimit === 0 ? 'Databases unavailable' : 'No databases found'}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {databaseLimit === 0
                                ? 'Databases cannot be created for this server.'
                                : 'Your server does not have any databases. Create one to get started.'}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
