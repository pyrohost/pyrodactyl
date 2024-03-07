import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { format } from 'date-fns';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

export default ({ schedule }: { schedule: Schedule }) => (
    <>
        <div className={`flex-1 md:ml-4`}>
            <p>{schedule.name}</p>
            <p className={`text-xs text-zinc-400`}>
                Last run at: {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}
            </p>
        </div>
        <div>
            <p
                // css={[
                //     tw`py-1 px-3 rounded text-xs uppercase text-white sm:hidden`,
                //     schedule.isActive ? tw`bg-green-600` : tw`bg-zinc-400`,
                // ]}
            >
                {schedule.isActive ? 'Active' : 'Inactive'}
            </p>
        </div>
        <ScheduleCronRow cron={schedule.cron} />
        <div>
            <p
                // css={[
                //     tw`py-1 px-3 rounded text-xs uppercase text-white hidden sm:block`,
                //     schedule.isActive && !schedule.isProcessing ? tw`bg-green-600` : tw`bg-zinc-400`,
                // ]}
            >
                {schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}
            </p>
        </div>
    </>
);
