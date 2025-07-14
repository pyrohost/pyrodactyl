import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/elements/button/index';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';

import { Schedule } from '@/api/server/schedules/getServerSchedules';

interface Props {
    schedule: Schedule;
    className?: string;
}

const NewTaskButton = ({ schedule, className }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TaskDetailsModal schedule={schedule} visible={visible} onModalDismissed={() => setVisible(false)} />
            <Button onClick={() => setVisible(true)} className={clsx(className)}>
                New Task
            </Button>
        </>
    );
};

export default NewTaskButton;
