import { useContext, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'pathe';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import { Button } from '@/components/elements/button/index';
import { FileObject } from '@/api/server/files/loadDirectory';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import Code from '@/components/elements/Code';
import asDialog from '@/hoc/asDialog';

interface Values {
    directoryName: string;
}

const schema = object().shape({
    directoryName: string().required('A valid directory name must be provided.'),
});

const generateDirectoryData = (name: string): FileObject => ({
    key: `dir_${name.split('/', 1)[0] ?? name}`,
    name: name.replace(/^(\/*)/, '').split('/', 1)[0] ?? name,
    mode: 'drwxr-xr-x',
    modeBits: '0755',
    size: 0,
    isFile: false,
    isSymlink: false,
    mimetype: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    isArchiveType: () => false,
    isEditable: () => false,
});

const NewDirectoryDialog = asDialog({
    title: 'New Folder',
})(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, []);

    const submit = ({ directoryName }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            .then(() => mutate((data) => [...data!, generateDirectoryData(directoryName)], false))
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ directoryName: '' }}>
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender key={'files:directory-modal'} />
                    <Form className={`m-0`}>
                        <Field autoFocus id={'directoryName'} name={'directoryName'} label={'Name'} />
                        <p className={`mt-2 !text-xs break-all`}>
                            <span className={`text-zinc-200`}>This folder will be created as&nbsp;</span>
                            <Code>
                                /root/
                                <span className={`text-blue-200`}>
                                    {join(directory, values.directoryName).replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </Code>
                        </p>
                    </Form>
                    <Dialog.Footer>
                        <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                            Cancel
                        </Button.Text>
                        <Button className={'w-full sm:w-auto'} onClick={submitForm}>
                            Create
                        </Button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryDialog open={open} onClose={setOpen.bind(this, false)} />
            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-l-full rounded-r-md text-sm font-bold shadow-md'
                onClick={setOpen.bind(this, true)}
            >
                New Folder
            </button>
        </>
    );
};
