import React, { useContext, useEffect, useState } from 'react';
import { ServerStateManager, ServerState } from '@/state/server/states';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, LucideCircleAlert, ServerOffIcon } from 'lucide-react';
import { useStatusPillOverride } from '@/components/server/StatusPillContext';
import clsx from 'clsx';
import { useServerState } from '@/state/server/useServerState';

export const StatusPill = () => {
    const status = useServerState();
    const { override, setStatusOverride } = useStatusPillOverride();
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 50);
        return () => clearTimeout(timer);
    }, [status, override]);

    const getStatusColor = () => {
        if (override) return override.color;
        switch (status) {
            case 'running':
                return 'bg-green-500/10 text-green-500';
            case 'starting':
                return 'bg-yellow-500/10 text-yellow-500';
            case 'stopped':
                return 'bg-orange-500/10 text-orange-500';
            case 'offline':
                return 'bg-red-500/10 text-red-500 items-center';
            default:
                return 'dark:bg-white text-black dark:text-zinc-400';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'running':
                return <CheckCircle className="h-4 w-4" />;
            case 'offline':
                return <ServerOffIcon className="h-4 w-4" />;
            default:
                return <LucideCircleAlert className="h-4 w-4" />;
        }
    };

    return (
        <Card 
            className={clsx(
                'inline-flex items-center gap-2 px-3 py-1 rounded-full',
                'transform transition-all duration-300 ease-spring',
                isTransitioning && 'scale-95 opacity-90',
                getStatusColor()
            )}
        >
            <CardContent 
                className={clsx(
                    "flex items-center gap-2 p-0",
                    "transition-all duration-300 ease-spring"
                )}
            >
                <span className="transition-transform duration-300 ease-spring">
                    {getStatusIcon()}
                </span>
                <span className="capitalize transition-all duration-300 ease-spring">
                    {override?.text || status}
                </span>
            </CardContent>
        </Card>
    );
};