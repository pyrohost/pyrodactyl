import { Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { object, string } from 'yup';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

import { httpErrorToHuman } from '@/api/http';
import renameServer from '@/api/server/renameServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    name: string;
    description: string;
}

const RenameServerForm = () => {
    const { t } = useTranslation();

    return (
        <TitledGreyBox title={t('server.settings.rename.title')}>
            <Form className='flex flex-col gap-4'>
                <Field id={'name'} name={'name'} label={t('server.settings.rename.server_name')} type={'text'} />
                <Field
                    id={'description'}
                    name={'description'}
                    label={t('server.settings.rename.server_description')}
                    type={'text'}
                />
                <div className={`mt-6 text-right`}>
                    <ActionButton variant='primary' type={'submit'}>
                        {t('save')}
                    </ActionButton>
                </div>
            </Form>
        </TitledGreyBox>
    );
};

const RenameServerBox = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { t } = useTranslation();

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        toast(t('server.settings.rename.toast.updating'));
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success(t('server.settings.rename.toast.updated')));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            validationSchema={object().shape({
                name: string().required().min(1),
                description: string().nullable(),
            })}
        >
            <RenameServerForm />
        </Formik>
    );
};

export default RenameServerBox;
