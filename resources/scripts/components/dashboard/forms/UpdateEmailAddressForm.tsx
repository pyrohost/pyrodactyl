import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { Fragment } from 'react';
import * as Yup from 'yup';

import Field from '@/components/elements/Field';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';

import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    email: string;
    password: string;
}

const schema = Yup.object().shape({
    email: Yup.string().email().required(),
    password: Yup.string().required('Debes indicar tu contraseña actual.'),
});

const UpdateEmailAddressForm = () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateEmail = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserEmail);

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: Values, { resetForm, setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:email');

        updateEmail({ ...values })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:email',
                    message: 'Se ha actualizado tu dirección de correo electrónico.',
                }),
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:email',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => {
                resetForm();
                setSubmitting(false);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ email: user!.email, password: '' }}>
            {({ isSubmitting, isValid }) => (
                <Fragment>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form className={`m-0`}>
                        <Field id={'current_email'} type={'email'} name={'email'} label={'Dirección de correo electrónico'} />
                        <div className={`mt-6`}>
                            <Field
                                id={'confirm_password'}
                                type={'password'}
                                name={'password'}
                                label={'Confirma la contraseña'}
                            />
                        </div>
                        <div className={`mt-6`}>
                            <Button disabled={isSubmitting || !isValid}>Actualizar</Button>
                        </div>
                    </Form>
                </Fragment>
            )}
        </Formik>
    );
};

export default UpdateEmailAddressForm;
