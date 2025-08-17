import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import HugeIconsRefresh from '@/components/elements/hugeicons/Refresh';

import { httpErrorToHuman } from '@/api/http';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const RotatePasswordButton = ({
    databaseId,
    onUpdate,
}: {
    databaseId: string;
    onUpdate: (database: ServerDatabase) => void;
}) => {
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const server = ServerContext.useStoreState((state) => state.server.data!);

    if (!databaseId) {
        return null;
    }

    const rotate = () => {
        setLoading(true);
        clearFlashes();

        rotateDatabasePassword(server.uuid, databaseId)
            .then((database) => onUpdate(database))
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                    key: 'database-connection-modal',
                });
            })
            .then(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    return (
        <ActionButton onClick={rotate} className='flex-none'>
            <div className='flex justify-center items-center h-4 w-4'>
                {!loading && <HugeIconsRefresh className='h-4 w-4' />}
                {loading && <Spinner size={'small'} />}
            </div>
        </ActionButton>
    );
};

export default RotatePasswordButton;
