import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { PageListContainer, PageListItem } from '@/components/elements/pages/PageList';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';

import { httpErrorToHuman } from '@/api/http';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

function ScheduleContainer() {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes('schedules');

        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Schedules'}>
            <FlashMessageRender byKey={'schedules'} />
            <MainPageHeader title={'Schedules'}>
                <Can action={'schedule.create'}>
                    <EditScheduleModal visible={visible} onModalDismissed={() => setVisible(false)} />
                    <ActionButton variant='primary' onClick={() => setVisible(true)}>
                        New Schedule
                    </ActionButton>
                </Can>
            </MainPageHeader>
            {!schedules.length && loading ? null : (
                <>
                    {schedules.length === 0 ? (
                        <p className={`text-center text-sm text-neutral-300`}>
                            There are no schedules configured for this server.
                        </p>
                    ) : (
                        <PageListContainer data-pyro-schedules>
                            {schedules.map((schedule) => (
                                <NavLink key={schedule.id} to={`${schedule.id}`} end>
                                    <PageListItem>
                                        <ScheduleRow schedule={schedule} />
                                    </PageListItem>
                                </NavLink>
                            ))}
                        </PageListContainer>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
}

export default ScheduleContainer;
