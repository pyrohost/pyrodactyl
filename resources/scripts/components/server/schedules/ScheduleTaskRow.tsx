import { ComponentType } from 'react';
import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import ItemContainer from '@/components/elements/ItemContainer';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import HugeIconsPower from '@/components/elements/hugeicons/Power';
import HugeIconsQuestion from '@/components/elements/hugeicons/Question';
import HugeIconsTerminal from '@/components/elements/hugeicons/Terminal';
import HugeIconsTrash from '@/components/elements/hugeicons/Trash';
import { HugeIconProps } from '@/components/elements/hugeicons/props';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';

import { httpErrorToHuman } from '@/api/http';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (action: string): [string, ComponentType<HugeIconProps>, boolean?] => {
    switch (action) {
        case 'command':
            return ['Send Command', HugeIconsTerminal, true];
        case 'power':
            return ['Send Power Action', HugeIconsPower];
        case 'backup':
            return ['Create Backup', HugeIconsCopy];
        default:
            return ['Unknown Action', HugeIconsQuestion];
    }
};

const ScheduleTaskRow = ({ schedule, task }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                }),
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, icon, copyOnClick] = getActionDetails(task.action);

    return (
        <ItemContainer
            title={title}
            description={task.payload}
            icon={icon}
            divClasses={`mb-2 gap-6`}
            copyDescription={copyOnClick}
            descriptionClasses={`whitespace-nowrap overflow-hidden text-ellipsis`}
        >
            <SpinnerOverlay visible={isLoading} fixed size={'large'} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onModalDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={'Confirm task deletion'}
                buttonText={'Delete Task'}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                Are you sure you want to delete this task? This action cannot be undone.
            </ConfirmationModal>
            {/* <FontAwesomeIcon icon={icon} className={`text-lg text-white hidden md:block`} /> */}
            {/* <div className={`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
                <p className={`md:ml-6 text-zinc-200 uppercase text-sm`}>{title}</p>
                {task.payload && (
                    <div className={`md:ml-6 mt-2`}>
                        {task.action === 'backup' && (
                            <p className={`text-xs uppercase text-zinc-400 mb-1`}>Ignoring files & folders:</p>
                        )}
                        <div
                            className={`font-mono bg-zinc-800 rounded-sm py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
                        >
                            {task.payload}
                        </div>
                    </div>
                )}
            </div> */}
            <div className={`flex flex-none items-end sm:items-center flex-col sm:flex-row gap-2`}>
                <div className='mr-0 sm:mr-6'>
                    {task.continueOnFailure && (
                        <div className={`px-2 py-1 bg-yellow-500 text-yellow-800 text-sm rounded-full`}>
                            Continues on Failure
                        </div>
                    )}
                    {task.sequenceId > 1 && task.timeOffset > 0 && (
                        <div className={`px-2 py-1 bg-zinc-500 text-sm rounded-full`}>{task.timeOffset}s later</div>
                    )}
                </div>
                <Can action={'schedule.update'}>
                    <ActionButton
                        variant='secondary'
                        size='sm'
                        className='flex flex-row items-center gap-2 ml-auto sm:ml-0'
                        onClick={() => setIsEditing(true)}
                        aria-label='Edit scheduled task'
                    >
                        <HugeIconsPencil fill='currentColor' />
                        Edit
                    </ActionButton>
                </Can>
                <Can action={'schedule.update'}>
                    <ActionButton
                        variant='danger'
                        size='sm'
                        onClick={() => setVisible(true)}
                        className='flex items-center gap-2'
                        aria-label='Delete scheduled task'
                    >
                        <HugeIconsTrash fill='currentColor' className='w-4 h-4' />
                        <span className='hidden sm:inline'>Delete</span>
                    </ActionButton>
                </Can>
            </div>
        </ItemContainer>
    );
};

export default ScheduleTaskRow;
