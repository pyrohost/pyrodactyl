import { Form, Formik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';

import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Values {
    databaseName: string;
    connectionsFrom: string;
}

const schema = object().shape({
    databaseName: string()
        .required('Debes indicar un nombre para la base de datos.')
        .min(3, 'El nombre de la base de datos debe contener al menos 3 caracteres.')
        .max(48, 'El nombre de la base de datos no puede pasar de los 48 caracteres.')
        .matches(
            /^[\w\-.]{3,48}$/,
            'El nombre de la base de datos solo puede contener caracteres alfanuméricos, barras bajas, guiones y/o puntos.',
        ),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, 'Debes indicar una dirección válida.'),
});

const CreateDatabaseButton = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                appendDatabase(database);
                setVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setVisible(false);
                        }}
                        title='Crear base de datos'
                    >
                        <div className='flex flex-col'>
                            <FlashMessageRender byKey={'database:create'} />
                            <Form>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={'Nombre de la base de datos'}
                                    description={'Un nombre descriptivo para tu base de datos.'}
                                />
                                <div className={`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={'Conexiones de'}
                                        description={
                                            'Las conexiones que se permitirán. Déjalo en blanco para permitir conexiones desde cualquier dirección.'
                                        }
                                    />
                                </div>
                                <div className={`flex gap-3 justify-end my-6`}>
                                    <Button type={'submit'}>Crear</Button>
                                </div>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>
            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md cursor-pointer'
                onClick={() => setVisible(true)}
            >
                Nueva base de datos
            </button>
        </>
    );
};

export default CreateDatabaseButton;
