import { Form, Formik, Field as FormikField, FormikHelpers, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { boolean, object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';

import createServerBackup from '@/api/server/backups/createServerBackup';
import getServerBackups from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Values {
    name: string;
    ignored: string;
    isLocked: boolean;
    children?: React.ReactNode;
}

const ModalContent = ({ ...props }: RequiredModalProps) => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting} title='Crear copia de seguridad'>
            <Form>
                <FlashMessageRender byKey={'backups:create'} />
                <Field
                    name={'name'}
                    label={'Nombre de la copia'}
                    description={'El nombre que referenciará esta copia de seguridad.'}
                />
                <div className={`mt-6 flex flex-col`}>
                    <FormikFieldWrapper
                        className='flex flex-col gap-2'
                        name={'ignored'}
                        label={'Archivos y carpetas ignoradas'}
                        description={`
                            Introduce los archivos o carpetas que ignorar al generar la copia de seguridad. Déjalo
                            en blanco para usar el contenido del archivo .pteroignore en la carpeta raíz de tu
                            servidor si existe. También puedes usar wildcards (*) y negar una regla usando un signo
                            de exclamación como prefijo.
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
                            label={'Bloqueado'}
                            description={'Previene que esta copia se elimine automáticamente o accidentalmente.'}
                        />
                    </div>
                </Can>
                <div className={`flex justify-end mb-6`}>
                    <Button role={'switch'} type={'submit'} disabled={isSubmitting}>
                        Crear
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

const CreateBackupButton = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [visible, setVisible] = useState(false);
    const { mutate } = getServerBackups();

    useEffect(() => {
        clearFlashes('backups:create');
    }, [visible]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('backups:create');
        createServerBackup(uuid, values)
            .then(async (backup) => {
                await mutate(
                    (data) => ({ ...data!, items: data!.items.concat(backup), backupCount: data!.backupCount + 1 }),
                    false,
                );
                setVisible(false);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups:create', error });
                setSubmitting(false);
            });
    };

    return (
        <>
            {visible && (
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', ignored: '', isLocked: false }}
                    validationSchema={object().shape({
                        name: string().max(191),
                        ignored: string(),
                        isLocked: boolean(),
                    })}
                >
                    <ModalContent appear visible={visible} onDismissed={() => setVisible(false)} />
                </Formik>
            )}
            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md cursor-pointer'
                onClick={() => setVisible(true)}
            >
                Nueva copia
            </button>
        </>
    );
};

export default CreateBackupButton;
