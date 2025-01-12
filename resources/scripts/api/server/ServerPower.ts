import http from '@/api/http';

export type PowerSignal = 'start' | 'stop' | 'restart' | 'kill';

interface PowerResponse {
    status: string;
}

export default async (uuid: string, signal: PowerSignal): Promise<PowerResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/power`, {
        signal,
    });

    // Start logging when server starts or restarts
    if (signal === 'start' || signal === 'restart') {
        try {
            
        } catch (error) {
            console.error('Failed to start console logging:', error);
        }
    }

    return data;
};