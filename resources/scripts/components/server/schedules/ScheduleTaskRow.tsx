import React, { useState } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import Icon from '@/components/elements/Icon';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (action: string): [string] => {
    switch (action) {
        case 'command':
            return ['Send Command'];
        case 'power':
            return ['Send Power Action'];
        case 'backup':
            return ['Create Backup'];
        default:
            return ['Unknown Action'];
    }
};

export default ({ schedule, task }: Props) => {
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
                })
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title] = getActionDetails(task.action);

    return (
        <div css={tw`sm:flex items-center p-3 sm:p-6 border-b border-zinc-800`}>
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
            {/* <FontAwesomeIcon icon={icon} css={tw`text-lg text-white hidden md:block`} /> */}
            <div css={tw`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
                <p css={tw`md:ml-6 text-zinc-200 uppercase text-sm`}>{title}</p>
                {task.payload && (
                    <div css={tw`md:ml-6 mt-2`}>
                        {task.action === 'backup' && (
                            <p css={tw`text-xs uppercase text-zinc-400 mb-1`}>Ignoring files & folders:</p>
                        )}
                        <div
                            css={tw`font-mono bg-zinc-800 rounded py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
                        >
                            {task.payload}
                        </div>
                    </div>
                )}
            </div>
            <div css={tw`mt-3 sm:mt-0 flex items-center w-full sm:w-auto`}>
                {task.continueOnFailure && (
                    <div css={tw`mr-6`}>
                        <div css={tw`flex items-center px-2 py-1 bg-yellow-500 text-yellow-800 text-sm rounded-full`}>
                            Continues on Failure
                        </div>
                    </div>
                )}
                {task.sequenceId > 1 && task.timeOffset > 0 && (
                    <div css={tw`mr-6`}>
                        <div css={tw`flex items-center px-2 py-1 bg-zinc-500 text-sm rounded-full`}>
                            {task.timeOffset}s later
                        </div>
                    </div>
                )}
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Edit scheduled task'}
                        css={tw`block text-sm p-2 text-zinc-500 hover:text-zinc-100 transition-colors duration-150 mr-4 ml-auto sm:ml-0`}
                        onClick={() => setIsEditing(true)}
                    >
                        FIXME: Edit
                    </button>
                </Can>
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Delete scheduled task'}
                        css={tw`block text-sm p-2 text-zinc-500 hover:text-red-600 transition-colors duration-150`}
                        onClick={() => setVisible(true)}
                    >
                        FIXME: Delete
                    </button>
                </Can>
            </div>
        </div>
    );
};
