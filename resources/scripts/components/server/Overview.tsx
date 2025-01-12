import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import UptimeDuration from '@/components/server/UptimeDuration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { debounce } from 'lodash';
import ServerLoader from '../elements/ServerLoad';
import LogoLoader from '../elements/ServerLoad';

interface OverviewProps {
    serverId: string;
}

interface ServerStats {
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

const LoadingCard = ({ children, isLoading, error }: { 
    children: React.ReactNode; 
    isLoading: boolean;
    error: string | null;
}) => {
    return (
        <Card className="bg-background dark:bg-background relative rounded-lg">
            {(isLoading || error) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <LogoLoader size='80px'/>
                        {error && (
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {children}
        </Card>
    );
};

const OverviewServerCard = ({ serverId }: OverviewProps) => {
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const eventSourceRef = useRef<EventSource | null>(null);
    const [isPending, startTransition] = useTransition();

    const debouncedSetStats = useCallback(
        debounce((newStats: ServerStats) => {
            startTransition(() => {
                setStats(newStats);
                setIsLoading(false);
                setError(null);
            });
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

    const memoizedStats = useMemo(() => ({
        state: stats?.attributes.current_state === 'running' ? 'Running' : 'Stopped',
        cpu: (stats?.attributes.resources.cpu_absolute || 0).toFixed(2),
        memory: ((stats?.attributes.resources.memory_bytes || 0) / (1024 * 1024)).toFixed(2),
        uptime: stats?.attributes.resources.uptime / 1000
    }), [stats]);

    return (
        <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <LoadingCard isLoading={isLoading} error={error}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <div className={`size-2 rounded-full animate-pulse ${
                                        memoizedStats.state === 'Running' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <span className="text-sm font-medium">Server State</span>
                                </div>
                                <div className="mt-2 text-2xl font-semibold">
                                    {memoizedStats.state}
                                </div>
                            </CardContent>
                        </LoadingCard>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Updates may be slightly delayed</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <LoadingCard isLoading={isLoading} error={error}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">CPU Usage</span>
                                </div>
                                <div className="mt-2 text-2xl font-semibold tabular-nums">
                                    {memoizedStats.cpu}%
                                </div>
                            </CardContent>
                        </LoadingCard>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Updates may be slightly delayed</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <LoadingCard isLoading={isLoading} error={error}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Memory Usage</span>
                                </div>
                                <div className="mt-2 text-2xl font-semibold tabular-nums">
                                    {memoizedStats.memory} MB
                                </div>
                            </CardContent>
                        </LoadingCard>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Updates may be slightly delayed</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <LoadingCard isLoading={isLoading} error={error}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Uptime</span>
                                </div>
                                <div className="mt-2 text-2xl font-semibold">
                                    <UptimeDuration uptime={memoizedStats.uptime} />
                                </div>
                            </CardContent>
                        </LoadingCard>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Updates may be slightly delayed</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default OverviewServerCard;