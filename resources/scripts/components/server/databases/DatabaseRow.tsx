import { faDatabase, faEye, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Formik, FormikHelpers } from 'formik';
import { For } from 'million/react';
import { useState } from 'react';
import styled from 'styled-components';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';
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

export default ({ database }: Props) => {
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

    const submit = (_: { confirm: string }, { setSubmitting }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
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
                                <Button type={'submit'} color={'red'} className='min-w-full my-6' disabled={!isValid}>
                                    Delete Database
                                </Button>
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

            {/* Title */}
            <div className={`flex-auto box-border min-w-fit`}>
                <div className='flex flex-row flex-none align-middle items-center gap-6'>
                    <FontAwesomeIcon icon={faDatabase} className='flex-none' />
                    <div>
                        <CopyOnClick text={database.name}>
                            <p className='text-lg'>{database.name}</p>
                        </CopyOnClick>
                        <CopyOnClick text={database.connectionString}>
                            <p className={`text-xs text-zinc-400 font-mono`}>{database.connectionString}</p>
                        </CopyOnClick>
                    </div>
                </div>
            </div>

            {/* Properties + buttons */}
            <div className={`flex flex-col items-center sm:gap-12 gap-4 sm:flex-row`}>
                <div className='flex flex-wrap gap-4 justify-center m-auto'>
                    <For
                        each={[
                            { label: 'Endpoint', value: database.connectionString },
                            { label: 'From', value: database.allowConnectionsFrom },
                            { label: 'Username', value: database.username },
                        ]}
                        memo
                    >
                        {(db, index) => (
                            <div key={index} className='text-center'>
                                <CopyOnClick text={db.value}>
                                    <p className='text-sm'>{db.value}</p>
                                </CopyOnClick>
                                <p className='mt-1 text-xs text-zinc-500 uppercase select-none'>{db.label}</p>
                            </div>
                        )}
                    </For>
                </div>

                <div className='flex align-middle items-center justify-center'>
                    <button
                        type={'button'}
                        aria-label={'View database connection details'}
                        className={`text-sm p-2 text-zinc-500 hover:text-zinc-100 transition-colors duration-150 mr-4 flex align-middle items-center justify-center flex-col cursor-pointer`}
                        onClick={() => setConnectionVisible(true)}
                    >
                        <FontAwesomeIcon icon={faEye} className={`px-5`} size='lg' />
                        Details
                    </button>
                    <Can action={'database.delete'}>
                        <button
                            type={'button'}
                            aria-label={'Delete database'}
                            className={`text-sm p-2 text-zinc-500 hover:text-red-600 transition-colors duration-150 flex align-middle items-center justify-center flex-col cursor-pointer`}
                            onClick={() => setVisible(true)}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} className={`px-5`} size='lg' />
                            Delete
                        </button>
                    </Can>
                </div>
                {/* <Button onClick={() => setConnectionVisible(true)}>
                        <FontAwesomeIcon icon={faEye} fixedWidth />
                    </Button>
                    <Can action={'database.delete'}>
                        <Button color={'red'} onClick={() => setVisible(true)}>
                            <FontAwesomeIcon icon={faTrashAlt} fixedWidth />
                        </Button>
                    </Can> */}
            </div>
        </>
    );
};
