import http from '@/api/http';
import { Schedule, rawDataToServerSchedule } from '@/api/server/schedules/getServerSchedules';

export default (uuid: string, schedule: number): Promise<Schedule> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/schedules/${schedule}`, {
            params: {
                include: ['tasks'],
            },
        })
            .then(({ data }) => resolve(rawDataToServerSchedule(data.attributes)))
            .catch(reject);
    });
};
