import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export const useServerState = () => {
    const [status, setStatus] = useState<ServerState>('offline');
    const { server } = usePage<PageProps>().props;
    
    useEffect(() => {
        const eventSource = new EventSource(`/api/client/servers/${server.uuid}/resources/stream`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setStatus(data.attributes.current_state);
            } catch (error) {
                console.error('Failed to parse server state', error);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [server.uuid]);

    return status;
}