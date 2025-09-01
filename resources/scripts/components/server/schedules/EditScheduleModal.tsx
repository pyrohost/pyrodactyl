import ModalContext from '@/context/ModalContext';
import { TZDate } from '@date-fns/tz';
import { faInfoCircle, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { useContext, useEffect, useMemo } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import ItemContainer from '@/components/elements/ItemContainer';
import { Button } from '@/components/elements/button/index';

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

const getTimezoneInfo = (serverTimezone: string) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const userOffsetString = format(now, 'xxx');
    let serverOffsetString: string;
    let offsetDifferenceMinutes = 0;

    let isServerTimezoneValid = true;
    try {
        const serverDate = new TZDate(now, serverTimezone);
        const userDate = new TZDate(now, userTimezone);
        serverOffsetString = format(serverDate, 'xxx');

        // offset difference in minutes
        const serverOffsetValue = serverDate.getTimezoneOffset();
        const userOffsetValue = userDate.getTimezoneOffset();

        // + values mean behind UTC
        // - values mean ahead of UTC
        offsetDifferenceMinutes = userOffsetValue - serverOffsetValue;
    } catch {
        serverOffsetString = 'Desconocido';
        isServerTimezoneValid = false;
    }

    let differenceDescription = '';
    if (!isServerTimezoneValid) {
        differenceDescription = 'a una diferencia desconocida de';
    } else if (offsetDifferenceMinutes === 0) {
        differenceDescription = 'misma hora';
    } else {
        const offsetDifferenceHours = offsetDifferenceMinutes / 60;
        const absDifferenceHours = Math.abs(offsetDifferenceHours);
        const isAhead = offsetDifferenceMinutes > 0;

        if (absDifferenceHours === Math.floor(absDifferenceHours)) {
            // whole hours
            differenceDescription = `${absDifferenceHours} hora${absDifferenceHours !== 1 ? 's' : ''} ${isAhead ? 'adelantado de' : 'atrasado de'}`;
        } else {
            // hours & minutes
            const hours = Math.floor(absDifferenceHours);
            const minutes = Math.abs(offsetDifferenceMinutes % 60);

            if (hours > 0) {
                differenceDescription = `${hours}h ${minutes}m ${isAhead ? 'adelantado de' : 'atrasado de'}`;
            } else {
                differenceDescription = `${minutes} minuto${minutes !== 1 ? 's' : ''} ${isAhead ? 'adelantado de' : 'atrasado de'}`;
            }
        }
    }

    return {
        user: { timezone: userTimezone, offset: userOffsetString },
        server: { timezone: serverTimezone, offset: serverOffsetString },
        difference: differenceDescription,
        isDifferent: userTimezone !== serverTimezone,
    };
};

const formatTimezoneDisplay = (timezone: string, offset: string) => {
    return `${timezone} (${offset})`;
};

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const serverTimezone = useStoreState((state) => state.settings.data?.timezone || 'Desconocido');

    const timezoneInfo = useMemo(() => {
        return getTimezoneInfo(serverTimezone);
    }, [serverTimezone]);

    useEffect(() => {
        setPropOverrides({ title: schedule ? 'Editar programa' : 'Crear nuevo programa' });
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
                        label={'Nombre del programa'}
                        description={'Un nombre que te ayude a identificar este programa.'}
                    />
                    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                        <Field name={'minute'} label={'Minuto'} />
                        <Field name={'hour'} label={'Hora'} />
                        <Field name={'dayOfMonth'} label={'Día del mes'} />
                        <Field name={'month'} label={'Mes'} />
                        <Field name={'dayOfWeek'} label={'Día de la semana'} />
                    </div>

                    {timezoneInfo.isDifferent && (
                        <div className={'bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 my-2'}>
                            <div className={'flex items-start gap-3'}>
                                <FontAwesomeIcon icon={faInfoCircle} className={'text-blue-400 mt-0.5 flex-shrink-0'} />
                                <div className={'text-sm'}>
                                    <p className={'text-blue-100 font-medium mb-1'}>Información de la zona horaria</p>
                                    <p className={'text-blue-200/80 text-xs mb-2'}>
                                        Aquí se muestran los tiempos configurados para la zona horaria del servidor.
                                        {timezoneInfo.difference !== 'same time' && (
                                            <span className={'text-blue-100 font-medium'}>
                                                {' '}
                                                El servidor está {timezoneInfo.difference} tu zona horaria.
                                            </span>
                                        )}
                                    </p>
                                    <div className={'mt-2 text-xs space-y-1'}>
                                        <div className={'text-blue-200/60'}>
                                            Tu zona horaria:
                                            <span className={'font-mono'}>
                                                {' '}
                                                {formatTimezoneDisplay(
                                                    timezoneInfo.user.timezone,
                                                    timezoneInfo.user.offset,
                                                )}
                                            </span>
                                        </div>
                                        <div className={'text-blue-200/60'}>
                                            Zona horaria del servidor:
                                            <span className={'font-mono'}>
                                                {' '}
                                                {formatTimezoneDisplay(
                                                    timezoneInfo.server.timezone,
                                                    timezoneInfo.server.offset,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className={`text-zinc-400 text-xs mt-2`}>
                        El sistema de programas soporta la sintaxis de Cronjob para definir cuándo se ejecutarán
                        las tareas. Usa los campos anteriores para especificar los tiempos del programa.
                    </p>

                    <div className='gap-3 my-6 flex flex-col'>
                        <a href='https://crontab.guru/' target='_blank' rel='noreferrer'>
                            <ItemContainer
                                description={'Editor en línea de expresiones Crontab.'}
                                title={'Gurú Crontab'}
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
                            description={'Este programa solo se ejecutará cuando el servidor se encuentre en línea.'}
                            label={'Cuando esté en línea'}
                        />
                        <FormikSwitchV2
                            name={'enabled'}
                            description={'Este programa se ejecutará automáticamente habilitando esta casilla.'}
                            label={'Automatizado'}
                        />
                    </div>
                    <div className={`mb-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? 'Guardar cambios' : 'Crear programa'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
