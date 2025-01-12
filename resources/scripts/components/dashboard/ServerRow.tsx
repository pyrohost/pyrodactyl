import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bytesToString, ip } from '@/lib/formatters';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ServerRowProps {
    server: Server;
    className?: string;
}

const ServerRow: React.FC<ServerRowProps> = ({ server, className }) => {

    console.log(server.limits.cpu);

    const interval = useRef<ReturnType<typeof setInterval>>(null) as React.MutableRefObject<ReturnType<typeof setInterval>>;
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const getStatusColor = (status: ServerPowerState | undefined): string => {
        if (status === 'offline') return 'bg-red-500';
        if (status === 'null') return 'bg-emerald-500';
        return 'bg-amber-500';
    };

    const hasNAStats = !stats || 
        stats.cpuUsagePercent === undefined || 
        stats.memoryUsageInBytes === undefined || 
        stats.diskUsageInBytes === undefined;

    return (
        <Card className={cn(
            "transition-all duration-300 cursor-pointer group rounded-2xl ",
            "dark:bg-black hover:shadow-xl dark:hover:shadow-xl dark:hover:shadow-700",
            "bg-white",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-3 h-3">
                            <div className={cn(
                                "absolute w-2 h-2 rounded-full",
                                getStatusColor(stats?.status)
                            )} />
                            <div className={cn(
                                "absolute w-2 h-2 rounded-full animate-ping",
                                getStatusColor(stats?.status),
                                "opacity-100"
                            )} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                                {server.name}
                            </h3>
                            <p className="text-sm text-zinc-500 truncate">
                                {server.allocations
                                    .filter((alloc) => alloc.isDefault)
                                    .map((allocation) => (
                                        <Fragment key={allocation.ip + allocation.port.toString()}>
                                            {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                        </Fragment>
                                    ))}
                            </p>
                        </div>
                    </div>
                    <Link 
                        href={`/server/${server.id}`} 
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out hover:scale-[1.2]",
                            "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 hover:text-black dark:hover:text-black",
                            "dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-200"
                        )}
                    >
                        Manage
                    </Link>
                </div>

                <Separator className="my-4 bg-black dark:bg-zinc-200" />

                <div className="mt-4 flex items-center justify-center">
                    {hasNAStats ? (
                        <span className="text-xs text-black dark:text-zinc-200 rounded-full dark:bg-zinc-800 bg-zinc-200 px-5">Sit tight!</span>
                    ) : isSuspended || server.status ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ease-in-out hover:scale-[1.2]",
                                        "bg-zinc-100 text-zinc-900",
                                        "dark:bg-zinc-200 dark:text-zinc-100"
                                    )}>
                                        {isSuspended ? 'Suspended' : 
                                        server.isTransferring ? 'Transferring' :
                                        server.status === 'installing' ? 'Installing' :
                                        server.status === 'restoring_backup' ? 'Restoring Backup' :
                                        'Unavailable'}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isSuspended ? 'Server is currently suspended' : 
                                    server.isTransferring ? 'Server is being transferred to another location' :
                                    server.status === 'installing' ? 'Server is being installed' :
                                    server.status === 'restoring_backup' ? 'Server is restoring from a backup' :
                                    'We couldn\'t retrieve the status of this server, Seems like the server is unavailable'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <div className="grid grid-cols-3 gap-6 w-full">
    <ServerStat 
        label="CPU" 
        value={`${stats.cpuUsagePercent.toFixed(2)}%`}
        limit={server.limits.cpu}
        type="cpu" 
    />
    <ServerStat 
        label="RAM" 
        value={bytesToString(stats.memoryUsageInBytes, 0)}
        limit={server.limits.memory}
        type="memory"
    />
    <ServerStat 
        label="Storage" 
        value={bytesToString(stats.diskUsageInBytes, 0)}
        limit={server.limits.disk}
        type="disk"
    />
</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const ServerStat: React.FC<{ 
    label: string; 
    value: string;
    limit?: number;
    type: 'cpu' | 'memory' | 'disk';
}> = ({ label, value, limit, type }) => {
    const getLimitDisplay = () => {
        if (!limit || limit === 0) return 'Unlimited';
        if (type === 'cpu') return `${limit}%`;
        return bytesToString(limit * 1024 * 1024, 0);
    };

    return (
        <div className="flex flex-col items-center ">
    
    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 px-3 py-1 dark:bg-zinc-700 rounded-lg bg-zinc-200">
        {label} : {value} {/* {getLimitDisplay()}*/ }
    </span>
</div>
    );
};

export default ServerRow;