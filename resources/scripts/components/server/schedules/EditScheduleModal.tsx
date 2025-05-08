import ModalContext from '@/context/ModalContext';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Formik, FormikHelpers } from 'formik';
// import { useContext, useEffect, useState } from 'react';
import { useContext, useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import ItemContainer from '@/components/elements/ItemContainer';
import { Button } from '@/components/elements/button/index';

// import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import asModal from '@/hoc/asModal';

import { httpErrorToHuman } from '@/api/http';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    // const [showCheatsheet, setShowCheetsheet] = useState(false);

    useEffect(() => {
        setPropOverrides({ title: schedule ? 'Edit schedule' : 'Create new schedule' });
    }, []);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form>
                    <FlashMessageRender byKey={'schedule:edit'} />
                    <Field
                        name={'name'}
                        label={'Schedule name'}
                        description={'A human readable identifier for this schedule.'}
                    />
                    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                        <Field name={'minute'} label={'Minute'} />
                        <Field name={'hour'} label={'Hour'} />
                        <Field name={'dayOfMonth'} label={'Day of month'} />
                        <Field name={'month'} label={'Month'} />
                        <Field name={'dayOfWeek'} label={'Day of week'} />
                    </div>
                    <p className={`text-zinc-400 text-xs mt-2`}>
                        The schedule system supports the use of Cronjob syntax when defining when tasks should begin
                        running. Use the fields above to specify when these tasks should begin running.
                    </p>
                    <div className='gap-3 my-6 flex flex-col'>
                        <a href='https://crontab.guru/' target='_blank' rel='noreferrer'>
                            <ItemContainer
                                description={'Online editor for cron schedule experessions.'}
                                title={'Crontab Guru'}
                                // defaultChecked={showCheatsheet}
                                // onChange={() => setShowCheetsheet((s) => !s)}
                                labelClasses='cursor-pointer'
                            >
                                <FontAwesomeIcon icon={faUpRightFromSquare} className={`px-5`} size='lg' />
                            </ItemContainer>
                        </a>
                        {/* This table would be pretty awkward to make look nice
                            Maybe there could be an element for a dropdown later? */}
                        {/* {showCheatsheet && (
                            <div className={`block md:flex w-full`}>
                                <ScheduleCheatsheetCards />
                            </div>
                        )} */}
                        <FormikSwitchV2
                            name={'onlyWhenOnline'}
                            description={'Only execute this schedule when the server is running.'}
                            label={'Only When Server Is Online'}
                        />
                        <FormikSwitchV2
                            name={'enabled'}
                            description={'This schedule will be executed automatically if enabled.'}
                            label={'Schedule Enabled'}
                        />
                    </div>
                    <div className={`mb-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? 'Save changes' : 'Create schedule'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
