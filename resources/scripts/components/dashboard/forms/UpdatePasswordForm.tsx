import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    current: string;
    password: string;
    confirmPassword: string;
}

const UpdatePasswordForm = () => {
    const { t } = useTranslation(); // Moved inside the component
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    // Define the validation schema inside the component to access the t function
    const schema = Yup.object().shape({
        current: Yup.string().min(1).required(t('settings.password.validation.current_required')),
        password: Yup.string().min(8).required(t('settings.password.validation.password_required')),
        confirmPassword: Yup.string()
            .required(t('settings.password.validation.confirm_required'))
            .oneOf([Yup.ref('password')], t('settings.password.validation.passwords_must_match')),
    });

    if (!user) {
        return null;
    }

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:password');
        updateAccountPassword({ ...values })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/auth/login';
            })
            .catch((error) =>
                addFlash({
                    key: 'account:password',
                    type: 'error',
                    title: t('error'),
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => setSubmitting(false));
    };

    return (
        <Fragment>
            <Formik
                onSubmit={submit}
                validationSchema={schema}
                initialValues={{ current: '', password: '', confirmPassword: '' }}
            >
                {({ isSubmitting, isValid }) => (
                    <Fragment>
                        <SpinnerOverlay size={'large'} visible={isSubmitting} />
                        <Form className={`m-0`}>
                            <Field
                                id={'current_password'}
                                type={'password'}
                                name={'current'}
                                label={t('settings.password.current_password')}
                            />
                            <div className={`mt-6`}>
                                <Field
                                    id={'new_password'}
                                    type={'password'}
                                    name={'password'}
                                    label={t('settings.password.new_password')}
                                    description={t('settings.password.requirements')}
                                />
                            </div>
                            <div className={`mt-6`}>
                                <Field
                                    id={'confirm_new_password'}
                                    type={'password'}
                                    name={'confirmPassword'}
                                    label={t('settings.password.confirm_password')}
                                />
                            </div>
                            <div className={`mt-6`}>
                                <ActionButton variant='primary' disabled={isSubmitting || !isValid}>
                                    {isSubmitting && <Spinner size='small' />}
                                    {isSubmitting ? t('common.updating') : t('settings.password.update_password')}
                                </ActionButton>
                            </div>
                        </Form>
                    </Fragment>
                )}
            </Formik>
        </Fragment>
    );
};

export default UpdatePasswordForm;
