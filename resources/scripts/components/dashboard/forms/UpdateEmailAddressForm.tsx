import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    email: string;
    password: string;
}



const UpdateEmailAddressForm = () => {
    const { t } = useTranslation();

    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateEmail = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserEmail);

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const schema = Yup.object().shape({
        email: Yup.string().email().required(t('auth.validation.email_required_reset')),
        password: Yup.string().required(t('auth.validation.password_required')),
    });

    const submit = (values: Values, { resetForm, setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:email');

        updateEmail({ ...values })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:email',
                    message: t('settings.email.updated_successfully'),
                }),
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:email',
                    title: t('error'),
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
                        <Field id={'current_email'} type={'email'} name={'email'} label={t('auth.email')} />
                        <div className={`mt-6`}>
                            <Field id={'confirm_password'} type={'password'} name={'password'} label={t('settings.password.confirm_password')} />
                        </div>
                        <div className={`mt-6`}>
                            <ActionButton variant='primary' disabled={isSubmitting || !isValid}>
                                {t('settings.email.update_email')}
                            </ActionButton>
                        </div>
                    </Form>
                </Fragment>
            )}
        </Formik>
    );
};

export default UpdateEmailAddressForm;
