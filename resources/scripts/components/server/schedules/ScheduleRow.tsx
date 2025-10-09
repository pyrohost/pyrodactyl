import { format } from 'date-fns';

import HugeIconsCalendar from '@/components/elements/hugeicons/Calendar';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

import { Schedule } from '@/api/server/schedules/getServerSchedules';

const ScheduleRow = ({ schedule }: { schedule: Schedule }) => (
    <>
        <div className={`flex-auto`}>
            <div className='flex flex-row flex-none align-middle items-center gap-6'>
                <HugeIconsCalendar className='flex-none' fill='currentColor' />
                <div>
                    <div className='flex flex-row items-center gap-2 text-lg'>
                        <p>{schedule.name}</p>
                    </div>
                    <p className={`text-xs text-zinc-400`}>
                        Última ejecución: {schedule.lastRunAt ? format(schedule.lastRunAt, "do MMM 'a las' h:mma") : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
        <ScheduleCronRow cron={schedule.cron} />
        <div className='flex-none w-20 sm:ml-2 flex items-center align-middle justify-center'>
            <p className='rounded-full px-2 py-px text-xs uppercase bg-neutral-600 text-white'>
                {schedule.isProcessing ? 'Procesando' : schedule.isActive ? 'Activo' : 'Inactivo'}
            </p>
        </div>
    </>
);

export default ScheduleRow;
