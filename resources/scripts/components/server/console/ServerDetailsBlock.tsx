import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import StatBlock from '@/components/server/console/StatBlock';
import { SocketEvent, SocketRequest } from '@/components/server/events';

import { bytesToString, ip, mbToBytes } from '@/lib/formatters';

import { SubdomainInfo, getSubdomainInfo } from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

// const getBackgroundColor = (value: number, max: number | null): string | undefined => {
//     const delta = !max ? 0 : value / max;

//     if (delta > 0.8) {
//         if (delta > 0.9) {
//             return 'bg-red-500';
//         }
//         return 'bg-yellow-500';
//     }

//     return undefined;
// };

// @ts-expect-error - Unused parameter in component definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => <>{children}</>;

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverAllocations = ServerContext.useStoreState((state) => state.server.data!.allocations);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits],
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    // Get display address (subdomain if available and active, otherwise IP)
    const displayAddress = useMemo(() => {
        if (
            subdomainInfo?.current_subdomain?.attributes?.is_active &&
            subdomainInfo.current_subdomain.attributes.full_domain
        ) {
            return subdomainInfo.current_subdomain.attributes.full_domain;
        }
        return allocation;
    }, [subdomainInfo, allocation, serverAllocations]);

    useEffect(() => {
        const loadSubdomainInfo = async () => {
            try {
                const data = await getSubdomainInfo(uuid);
                setSubdomainInfo(data);
            } catch (error) {
                // Silently fail - subdomain feature might not be available
                setSubdomainInfo(null);
            }
        };

        loadSubdomainInfo();
    }, [uuid]);

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    return (
        <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `50ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <StatBlock title={'IP Address'} copyOnClick={displayAddress}>
                    {displayAddress}
                </StatBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `75ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <StatBlock title={'CPU'}>
                    {status === 'offline' ? (
                        <span className={'text-zinc-400'}>Offline</span>
                    ) : (
                        <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                    )}
                </StatBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `100ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <StatBlock title={'RAM'}>
                    {status === 'offline' ? (
                        <span className={'text-zinc-400'}>Offline</span>
                    ) : (
                        <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                    )}
                </StatBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `125ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <StatBlock title={'Storage'}>
                    <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
                </StatBlock>
            </div>
        </div>
    );
};

export default ServerDetailsBlock;
