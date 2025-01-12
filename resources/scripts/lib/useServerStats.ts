import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

export interface ServerStats {
    object: string;
    attributes: {
        current_state: string;
        is_suspended: boolean;
        resources: {
            cpu_absolute: number;
            disk_bytes: number;
            memory_bytes: number;
            network_rx_bytes: number;
            network_tx_bytes: number;
            uptime: number;
        }
    }
}

export const useServerStats = (serverId: string) => {
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const eventSourceRef = useRef<EventSource | null>(null);

    const debouncedSetStats = useCallback(
        debounce((newStats: ServerStats) => {
            setStats(newStats);
            setIsLoading(false);
            setError(null);
        }, 100),
        []
    );

    const setupEventSource = useCallback(() => {
        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            setIsLoading(true);
            eventSourceRef.current = new EventSource(`/api/client/servers/${serverId}/resources/stream`);

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(data);
                    debouncedSetStats(data);
                } catch (err) {
                    console.error('Error parsing stats:', err);
                    setError('Failed to parse server stats');
                    setIsLoading(false);
                }
            };

            eventSourceRef.current.onerror = (event) => {
                const target = event.target as EventSource;
                if (target.readyState === EventSource.CLOSED) {
                    console.error('EventSource connection closed');
                    setError('Connection lost');
                    setIsLoading(true);
                    setTimeout(setupEventSource, 5000); // Attempt to reconnect after 5 seconds
                }
            };
        } catch (err) {
            console.error('Failed to setup EventSource:', err);
            setError('Failed to connect to server');
            setIsLoading(false);
        }
    }, [serverId, debouncedSetStats]);

    useEffect(() => {
        setupEventSource();
        return () => {
            eventSourceRef.current?.close();
            debouncedSetStats.cancel();
        };
    }, [setupEventSource, debouncedSetStats]);

    return { stats, error, isLoading };
};

