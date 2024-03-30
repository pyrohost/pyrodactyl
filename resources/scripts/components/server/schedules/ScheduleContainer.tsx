import { useEffect, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { httpErrorToHuman } from '@/api/http';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { NavLink } from 'react-router-dom';
import { MainPageHeader } from '@/components/elements/MainPageHeader';

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
                    <button
                        style={{
                            background:
                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                        }}
                        className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md'
                        onClick={() => setVisible(true)}
                    >
                        New Schedule
                    </button>
                </Can>
            </MainPageHeader>
            {!schedules.length && loading ? null : (
                <>
                    <div
                        data-pyro-backups
                        style={{
                            background:
                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                        }}
                        className='p-1 border-[1px] border-[#ffffff12] rounded-xl'
                    >
                        <div className='w-full h-full overflow-hidden rounded-lg flex flex-col gap-1'>
                            {schedules.length === 0 ? (
                                <p className={`text-sm text-center text-neutral-300`}>
                                    There are no schedules configured for this server.
                                </p>
                            ) : (
                                schedules.map((schedule) => (
                                    <NavLink key={schedule.id} to={`${schedule.id}`} end>
                                        <div className='flex bg-[#ffffff11] hover:bg-[#ffffff19] transition duration-100 hover:duration-0 px-6 py-4 rounded-md items-center'>
                                            <ScheduleRow schedule={schedule} />
                                        </div>
                                    </NavLink>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
}

export default ScheduleContainer;
