import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';

import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Props {
    scheduleId: number;
    onDeleted: () => void;
}

const DeleteScheduleButton = ({ scheduleId, onDeleted }: Props) => {
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onDelete = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteSchedule(uuid, scheduleId)
            .then(() => {
                setIsLoading(false);
                onDeleted();
            })
            .catch((error) => {
                console.error(error);

                addError({ key: 'schedules', message: httpErrorToHuman(error) });
                setIsLoading(false);
                setVisible(false);
            });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                onClose={() => setVisible(false)}
                title={'Delete Schedule'}
                confirm={'Delete'}
                onConfirmed={onDelete}
            >
                <SpinnerOverlay visible={isLoading} />
                All tasks will be removed and any running processes will be terminated.
            </Dialog.Confirm>
            <Button.Danger
                variant={Button.Variants.Secondary}
                className={'flex-1 sm:flex-none border-transparent'}
                onClick={() => setVisible(true)}
            >
                Delete
            </Button.Danger>
        </>
    );
};

export default DeleteScheduleButton;
