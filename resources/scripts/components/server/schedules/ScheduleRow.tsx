import { format } from 'date-fns';

import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

import { Schedule } from '@/api/server/schedules/getServerSchedules';

export default ({ schedule }: { schedule: Schedule }) => (
    <>
        <div className={`flex-1`}>
            <p>{schedule.name}</p>
            <p className={`text-xs text-zinc-400`}>
                Last run at: {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}
            </p>
        </div>
        <ScheduleCronRow cron={schedule.cron} />
        <div>
            <p className='ml-4'>{schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}</p>
        </div>
    </>
);
