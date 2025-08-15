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
            <MainPageHeader
                direction='column'
                title={'Schedules'}
                titleChildren={
                    <Can action={'schedule.create'}>
                        <ActionButton variant='primary' onClick={() => setVisible(true)}>
                            New Schedule
                        </ActionButton>
                    </Can>
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Automate server tasks with scheduled commands. Create recurring tasks to manage your server, run
                    backups, or execute custom commands.
                </p>
            </MainPageHeader>
            <Can action={'schedule.create'}>
                <EditScheduleModal visible={visible} onModalDismissed={() => setVisible(false)} />
            </Can>
            {!schedules.length && loading ? null : (
                <>
                    {schedules.length === 0 ? (
                        <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                            <div className='text-center'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                    <svg className='w-8 h-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </div>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>No schedules found</h3>
                                <p className='text-sm text-zinc-400 max-w-sm'>
                                    Your server does not have any scheduled tasks. Create one to automate server
                                    management.
                                </p>
                            </div>
                        </div>
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
