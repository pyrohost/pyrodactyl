import ModalContext from '@/context/ModalContext';
import { Form, Formik, Field as FormikField, FormikHelpers, useField } from 'formik';
import { useContext, useEffect } from 'react';
import styled from 'styled-components';
import { boolean, number, object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import Select from '@/components/elements/Select';

import asModal from '@/hoc/asModal';

import { httpErrorToHuman } from '@/api/http';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

// TODO: Port modern dropdowns to Formik and integrate them
// import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/elements/DropdownMenu';
// import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
// import HugeIconsArrowUp from '@/components/elements/hugeicons/ArrowUp';

const Label = styled.label`
    display: inline-block;
    color: #ffffff77;
    font-size: 0.875rem;
    padding-bottom: 0.5rem;
`;

interface Props {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        then: () => string().required('Debes indicar una acción.'),
        otherwise: () => string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('El desplazamiento de tiempo debe ser un número válido entre 0 y 900.')
        .required('Debes indicar el valor de desplazamiento de tiempo.')
        .min(0, 'El valor de desplazamiento debe ser al menos de 0 segundos.')
        .max(900, 'El valor de desplazamiento debe ser como máximo de 900 segundos.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss, setPropOverrides } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:task');
        };
    }, []);

    useEffect(() => {
        setPropOverrides({ title: task ? 'Editar tarea' : 'Crear tarea' });
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "No se puede crear una copia ya que este servidor ha alcanzado el límite.",
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((task) => {
                    let tasks = schedule.tasks.map((t) => (t.id === task.id ? task : t));
                    if (!schedule.tasks.find((t) => t.id === task.id)) {
                        tasks = [...tasks, task];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <div className='min-w-full'>
            <Formik
                onSubmit={submit}
                validationSchema={schema}
                initialValues={{
                    action: task?.action || 'command',
                    payload: task?.payload || '',
                    timeOffset: task?.timeOffset.toString() || '0',
                    continueOnFailure: task?.continueOnFailure || false,
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <FlashMessageRender byKey={'schedule:task'} />
                        <div className={`flex flex-col gap-3`}>
                            <div>
                                <Label>Acción</Label>
                                <ActionListener />
                                <FormikFieldWrapper name={'action'}>
                                    <FormikField
                                        className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                        as={Select}
                                        name={'action'}
                                    >
                                        <option className='bg-black' value={'command'}>
                                            Ejecutar comando
                                        </option>
                                        <option className='bg-black' value={'power'}>
                                            Establecer estado
                                        </option>
                                        <option className='bg-black' value={'backup'}>
                                            Crear copia
                                        </option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                            <div>
                                <Field
                                    name={'timeOffset'}
                                    label={'Desplazamiento temporal (en segundos)'}
                                    description={
                                        'La cantidad de tiempo a esperar después de la tarea previa antes de ejecutar esta. Si esta es la primera tarea en el programa, este valor se ignorará.'
                                    }
                                />
                            </div>
                        </div>
                        <div className={`my-6`}>
                            {values.action === 'command' ? (
                                <div>
                                    <Label>Comando</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            className='w-full rounded-xl p-2 bg-[#ffffff11]'
                                            as={Textarea}
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            ) : values.action === 'power' ? (
                                <div>
                                    <Label>Estado</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                            as={Select}
                                            name={'payload'}
                                        >
                                            <option className='bg-black' value={'start'}>
                                                Iniciar el servidor
                                            </option>
                                            <option className='bg-black' value={'restart'}>
                                                Reiniciar el servidor
                                            </option>
                                            <option className='bg-black' value={'stop'}>
                                                Detener el servidor
                                            </option>
                                            <option className='bg-black' value={'kill'}>
                                                Forzar la detención del servidor
                                            </option>
                                        </FormikField>
                                    </FormikFieldWrapper>
                                </div>
                            ) : (
                                <div>
                                    <Label>Archivos ignorados (opcional)</Label>
                                    <FormikFieldWrapper
                                        name={'payload'}
                                        description={
                                            'Los archivos y carpetas que se ignorarán en esta copia. Por defecto, se aplicarán los contenidos del archivo .pteroignore (si existe). Si has alcanzado el límite de copias, la más antigua se eliminará.'
                                        }
                                    >
                                        <FormikField
                                            className='w-full rounded-2xl bg-[#ffffff11]'
                                            as={Textarea}
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            )}
                        </div>
                        <FormikSwitchV2
                            name={'continueOnFailure'}
                            description={'Las siguientes tareas se ejecutarán si esta falla'}
                            label={'Continuar al fallar'}
                        />
                        <div className={`flex justify-end my-6`}>
                            <ActionButton variant='primary' type={'submit'} disabled={isSubmitting}>
                                {task ? 'Guardar cambios' : 'Crear tarea'}
                            </ActionButton>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default asModal<Props>()(TaskDetailsModal);
