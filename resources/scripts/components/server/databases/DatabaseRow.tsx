import { Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import styled from 'styled-components';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsEye from '@/components/elements/hugeicons/Eye';
import HugeIconsTrash from '@/components/elements/hugeicons/Trash';
import { PageListItem } from '@/components/elements/pages/PageList';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';

import { httpErrorToHuman } from '@/api/http';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const Label = styled.label`
    display: inline-block;
    color: #ffffff77;
    font-size: 0.875rem;
    padding-bottom: 0.5rem;
`;

interface Props {
    database: ServerDatabase;
}

const DatabaseRow = ({ database }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${
        database.password ? `:${encodeURIComponent(database.password)}` : ''
    }@${database.connectionString}/${database.name}`;

    const schema = object().shape({
        confirm: string()
            .required('The database name must be provided.')
            .oneOf([database.name.split('_', 2)[1] || '', database.name], 'The database name must be provided.'),
    });

    const submit = (_: { confirm: string }, { setSubmitting, resetForm }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                resetForm();
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
                setSubmitting(false);
            })
            .catch((error) => {
                resetForm();
                console.error(error);
                setSubmitting(false);
                addError({
                    key: 'database:delete',
                    message: httpErrorToHuman(error),
                });
            });
    };

    return (
        <>
            <Formik onSubmit={submit} initialValues={{ confirm: '' }} validationSchema={schema} isInitialValid={false}>
                {({ isSubmitting, isValid, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            setVisible(false);
                            resetForm();
                        }}
                        title='Confirm database deletion'
                    >
                        <FlashMessageRender byKey={'database:delete'} />
                        <div className='flex flex-col'>
                            <p>
                                Deleting a database is a permanent action, it cannot be undone. This will permanently
                                delete the <strong>{database.name}</strong> database and remove all its data.
                            </p>
                            <Form className='mt-6'>
                                <Field
                                    type={'text'}
                                    id={'confirm_name'}
                                    name={'confirm'}
                                    label={'Confirm Database Name'}
                                    description={'Enter the database name to confirm deletion.'}
                                />
                                <ActionButton
                                    variant='danger'
                                    type={'submit'}
                                    className='min-w-full my-6'
                                    disabled={!isValid || isSubmitting}
                                >
                                    {isSubmitting && <Spinner size='small' />}
                                    {isSubmitting ? 'Deleting...' : 'Delete Database'}
                                </ActionButton>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            <Modal
                visible={connectionVisible}
                title='Database connection details'
                closeButton={true}
                onDismissed={() => setConnectionVisible(false)}
            >
                <FlashMessageRender byKey={'database-connection-modal'} />
                <div className='flex flex-col min-w-full gap-4'>
                    <div className='grid gap-4 sm:grid-cols-2 min-w-full'>
                        <div className='flex flex-col'>
                            <Label>Endpoint</Label>
                            <CopyOnClick text={database.connectionString}>
                                <Input type={'text'} readOnly value={database.connectionString} />
                            </CopyOnClick>
                        </div>
                        <div className='flex flex-col'>
                            <Label>Connections from</Label>
                            <CopyOnClick text={database.allowConnectionsFrom}>
                                <Input type={'text'} readOnly value={database.allowConnectionsFrom} />
                            </CopyOnClick>
                        </div>
                        <div className='flex flex-col'>
                            <Label>Username</Label>
                            <CopyOnClick text={database.username}>
                                <Input type={'text'} readOnly value={database.username} />
                            </CopyOnClick>
                        </div>
                        <Can action={'database.view_password'}>
                            <div className='flex flex-col'>
                                <Label>Password</Label>
                                <div className='flex flex-row min-w-full gap-2'>
                                    <CopyOnClick text={database.password} showInNotification={false}>
                                        <Input
                                            type={'password'}
                                            readOnly
                                            value={database.password}
                                            className='flex-auto'
                                        />
                                    </CopyOnClick>
                                    <Can action={'database.update'}>
                                        <RotatePasswordButton databaseId={database.id} onUpdate={appendDatabase} />
                                    </Can>
                                </div>
                            </div>
                        </Can>
                    </div>
                    <div className='flex flex-col'>
                        <div className='flex flex-row gap-2 align-middle items-center'>
                            <Label>JDBC Connection String</Label>
                        </div>
                        <CopyOnClick text={jdbcConnectionString} showInNotification={false}>
                            <Input type={'password'} readOnly value={jdbcConnectionString} />
                        </CopyOnClick>
                    </div>
                </div>
            </Modal>

            <PageListItem>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full'>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-3 mb-2'>
                            <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                <HugeIconsDatabase fill='currentColor' className='text-zinc-400 w-4 h-4' />
                            </div>
                            <div className='min-w-0 flex-1'>
                                <CopyOnClick text={database.name}>
                                    <h3 className='text-base font-medium text-zinc-100 truncate'>{database.name}</h3>
                                </CopyOnClick>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm'>
                            <div>
                                <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Endpoint</p>
                                <CopyOnClick text={database.connectionString}>
                                    <p className='text-zinc-300 font-mono truncate'>{database.connectionString}</p>
                                </CopyOnClick>
                            </div>
                            <div>
                                <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>From</p>
                                <CopyOnClick text={database.allowConnectionsFrom}>
                                    <p className='text-zinc-300 font-mono truncate'>{database.allowConnectionsFrom}</p>
                                </CopyOnClick>
                            </div>
                            <div>
                                <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>Username</p>
                                <CopyOnClick text={database.username}>
                                    <p className='text-zinc-300 font-mono truncate'>{database.username}</p>
                                </CopyOnClick>
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-2 sm:flex-col sm:gap-3'>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={() => setConnectionVisible(true)}
                            className='flex items-center gap-2'
                        >
                            <HugeIconsEye fill='currentColor' className='w-4 h-4' />
                            <span className='hidden sm:inline'>Details</span>
                        </ActionButton>
                        <Can action={'database.delete'}>
                            <ActionButton
                                variant='danger'
                                size='sm'
                                onClick={() => setVisible(true)}
                                className='flex items-center gap-2'
                            >
                                <HugeIconsTrash fill='currentColor' className='w-4 h-4' />
                                <span className='hidden sm:inline'>Delete</span>
                            </ActionButton>
                        </Can>
                    </div>
                </div>
            </PageListItem>
        </>
    );
};

export default DatabaseRow;
