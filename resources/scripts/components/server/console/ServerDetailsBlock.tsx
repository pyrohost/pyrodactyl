import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, MemoryStickIcon as Memory, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { debounce } from 'lodash';
import ServerLoader from '@/components/elements/ServerLoad';
import LogoLoader from '@/components/elements/ServerLoad';

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

interface Server {
    identifier: string;
    limits: {
        cpu: number;
        memory: number;
        disk: number;
    };
}

const ResourceCard = ({ 
    icon: Icon, 
    label, 
    usage, 
    limit, 
    unit,
    isLoading,
    error 
}: { 
    icon: any; 
    label: string; 
    usage: number; 
    limit: number; 
    unit: string;
    isLoading: boolean;
    error: string | null;
}) => {
    const percentage = (usage / limit) * 100;
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className="bg-background dark:bg-background shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error ? (
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <p className="text-xs">{error}</p>
                                </div>
                            ) : isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xl font-bold">
                                            {usage.toFixed(2)}<span className="text-xs ml-1">{unit}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            / {limit === 0 ? '∞' : limit} {unit}
                                        </p>
                                    </div>
                                    <Progress value={percentage} className="h-2 border-black" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Usage: {percentage.toFixed(1)}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

};


const ResourceUsage = () => {
    const { server } = usePage().props as { server: Server };
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
            eventSourceRef.current = new EventSource(`/api/client/servers/${server.identifier}/resources/stream`);

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
    }, [server.identifier, debouncedSetStats]);

    useEffect(() => {
        setupEventSource();
        return () => {
            eventSourceRef.current?.close();
            debouncedSetStats.cancel();
        };
    }, [setupEventSource, debouncedSetStats]);

    const memoizedStats = useMemo(() => ({
        cpu: stats?.attributes.resources.cpu_absolute || 0,
        memory: (stats?.attributes.resources.memory_bytes || 0) / (1024 * 1024),
        disk: (stats?.attributes.resources.disk_bytes || 0) / (1024 * 1024),
    }), [stats]);

    return (
        <Card className="bg-background dark:bg-background shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Resource Usage
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {error ? (
                    <div className="flex items-center gap-2 text-destructive justify-center ">
                        <LogoLoader size="80px"/>
                        <p className="text-sm">Ooops! {error}</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground mb-12 justify-center items-center">
                        <LogoLoader size="80px"/>
                        
                    </div>
                ) : (
                    <>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard 
                icon={Cpu} 
                label="CPU Usage" 
                usage={memoizedStats.cpu} 
                limit={server.limits.cpu}
                unit="%"
                isLoading={isLoading}
                error={error}
            />
            <ResourceCard 
                icon={Memory} 
                label="Memory Usage" 
                usage={memoizedStats.memory} 
                limit={server.limits.memory}
                unit="MB"
                isLoading={isLoading}
                error={error}
            />
            <ResourceCard 
                icon={HardDrive} 
                label="Disk Usage" 
                usage={memoizedStats.disk} 
                limit={server.limits.disk}
                unit="MB"
                isLoading={isLoading}
                error={error}
            />
        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ResourceUsage;

