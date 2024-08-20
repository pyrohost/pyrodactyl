import { Form, Formik, FormikHelpers } from 'formik';
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
    className?: string;
}

export default ({ database, className }: Props) => {
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
                    <div className='grid gap-4 grid-cols-2 min-w-full'>
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
            <div className={className}>
                <div className={`hidden md:block`}>
                    {/* <FontAwesomeIcon icon={faDatabase} fixedWidth /> */}
                    FIXME: Database Icon
                </div>
                <div className={`flex-1 ml-4`}>
                    <CopyOnClick text={database.name}>
                        <p className={`text-lg`}>{database.name}</p>
                    </CopyOnClick>
                </div>
                <div className={`ml-8 text-center hidden md:block`}>
                    <CopyOnClick text={database.connectionString}>
                        <p className={`text-sm`}>{database.connectionString}</p>
                    </CopyOnClick>
                    <p className={`mt-1 text-xs text-zinc-500 uppercase select-none`}>Endpoint</p>
                </div>
                <div className={`ml-8 text-center hidden md:block`}>
                    <p className={`text-sm`}>{database.allowConnectionsFrom}</p>
                    <p className={`mt-1 text-xs text-zinc-500 uppercase select-none`}>Connections from</p>
                </div>
                <div className={`ml-8 text-center hidden md:block`}>
                    <CopyOnClick text={database.username}>
                        <p className={`text-sm`}>{database.username}</p>
                    </CopyOnClick>
                    <p className={`mt-1 text-xs text-zinc-500 uppercase select-none`}>Username</p>
                </div>
                <div className={`ml-8`}>
                    <Button isSecondary onClick={() => setConnectionVisible(true)}>
                        {/* <FontAwesomeIcon icon={faEye} fixedWidth /> */}
                        FIXME: Visible Eye Icon
                    </Button>
                    <Can action={'database.delete'}>
                        <Button color={'red'} isSecondary onClick={() => setVisible(true)}>
                            {/* <FontAwesomeIcon icon={faTrashAlt} fixedWidth /> */}
                            FIXME: Trash Icon
                        </Button>
                    </Can>
                </div>
            </div>
        </>
    );
};
