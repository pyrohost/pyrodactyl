import { fileBitsToString } from '@/helpers';
import { Form, Formik, FormikHelpers } from 'formik';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';

import chmodFiles from '@/api/server/files/chmodFiles';

import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';

interface FormikValues {
    mode: string;
}

interface File {
    file: string;
    mode: string;
}

type OwnProps = RequiredModalProps & { files: File[] };

const ChmodFileModal = ({ files, ...props }: OwnProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const submit = async ({ mode }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        await mutate(
            (data) =>
                data!.map((f) =>
                    f.name === files[0]?.file ? { ...f, mode: fileBitsToString(mode, !f.isFile), modeBits: mode } : f,
                ),
            false,
        );

        const data = files.map((f) => ({ file: f.file, mode: mode }));

        chmodFiles(uuid, directory, data)
            .then((): Promise<any> => (files.length > 0 ? mutate() : Promise.resolve()))
            .then(() => setSelectedFiles([]))
            .catch((error) => {
                mutate();
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    return (
        <Formik onSubmit={submit} initialValues={{ mode: files.length > 1 ? '' : (files[0]?.mode ?? '') }}>
            {({ isSubmitting }) => (
                <Modal
                    {...props}
                    title='Configurar permisos'
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                >
                    <Form className={`w-full m-0`}>
                        <div className={`flex flex-col`}>
                            <div className={`w-full`}>
                                <Field
                                    type={'string'}
                                    id={'file_mode'}
                                    name={'mode'}
                                    label={'Modo de archivo'}
                                    description={
                                        'Esto está pensado para usuarios avanzados. Por favor, procede con precaución: puedes dañar permanentemente tu servidor al cambiar los permisos de archivo'
                                    }
                                    autoFocus
                                />
                            </div>
                            <div className={`flex justify-end w-full my-6`}>
                                <ActionButton variant='primary' type='submit'>
                                    Actualizar
                                </ActionButton>
                            </div>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ChmodFileModal;
