import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip } from '@/lib/formatters';
import styled from 'styled-components';
// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled.div<{ $status: ServerPowerState | undefined }>`
    // background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.044) 100%);
    border: 1px solid #ffffff07;
    background: #ffffff11;
    transition: all 250ms ease-in-out;
    padding: 1.75rem 2rem;
    cursor: pointer;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;

    &:hover {
        border: 1px solid #ffffff11;
        background: #ffffff18;
    }

    & .status-bar {
        width: 12px;
        height: 12px;
        min-width: 12px;
        min-height: 12px;
        background-color: #ffffff11;
        z-index: 20;
        border-radius: 9999px;
        transition: all 250ms ease-in-out;

        box-shadow: ${({ $status }) =>
            !$status || $status === 'offline'
                ? '0 0 12px 1px #C74343'
                : $status === 'running'
                ? '0 0 12px 1px #43C760'
                : '0 0 12px 1px #c7aa43'};

        background: ${({ $status }) =>
            !$status || $status === 'offline'
                ? `linear-gradient(180deg, #C74343 0%, #C74343 100%)`
                : $status === 'running'
                ? `linear-gradient(180deg, #91FFA9 0%, #43C760 100%)`
                : `linear-gradient(180deg, #c7aa43 0%, #c7aa43 100%)`};
    }
`;

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    // const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    // const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    // const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    return (
        <StatusIndicatorBox as={Link} to={`/server/${server.id}`} className={className} $status={stats?.status}>
            <div className={`flex items-center`}>
                {/* <div className={'icon mr-4'}>
                    <FontAwesomeIcon icon={faServer} />
                </div> */}
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                        <p className={`text-xl tracking-tight font-bold break-words`}>{server.name}</p>{' '}
                        <div className={'status-bar'} />
                    </div>
                    <p className={`text-sm text-[#ffffff66]`}>
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </Fragment>
                            ))}
                    </p>
                    {/* I don't think servers will ever have descriptions normall so I'll vaporize it */}
                    {/* {!!server.description && <p className={`text-sm text-zinc-300 break-words `}>{server.description}</p>} */}
                </div>
            </div>
            <div
                className={`h-full hidden sm:flex items-center justify-center bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-md w-fit whitespace-nowrap px-4 py-2 text-sm gap-4`}
            >
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div className={`flex-1 text-center`}>
                            <span className={`text-red-100 text-xs`}>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div className={`flex-1 text-center`}>
                            <span className={`text-zinc-100 text-xs`}>
                                {server.isTransferring
                                    ? 'Transferring'
                                    : server.status === 'installing'
                                    ? 'Installing'
                                    : server.status === 'restoring_backup'
                                    ? 'Restoring Backup'
                                    : 'Unavailable'}
                            </span>
                        </div>
                    ) : (
                        // <Spinner size={'small'} />
                        // <></>
                        <div className='text-xs opacity-25'>Sit tight!</div>
                    )
                ) : (
                    <Fragment>
                        <div className={`sm:flex hidden`}>
                            <div className={`flex justify-center gap-2 w-fit`}>
                                <p className='text-sm text-[#ffffff66] font-bold w-fit whitespace-nowrap'>CPU</p>
                                <p className='font-bold w-fit whitespace-nowrap'>{stats.cpuUsagePercent.toFixed(2)}%</p>
                            </div>
                            {/* <p className={`text-xs text-zinc-600 text-center mt-1`}>of {cpuLimit}</p> */}
                        </div>
                        <div className={`sm:flex hidden`}>
                            {/* <p className={`text-xs text-zinc-600 text-center mt-1`}>of {memoryLimit}</p> */}
                            <div className={`flex justify-center gap-2 w-fit`}>
                                <p className='text-sm text-[#ffffff66] font-bold w-fit whitespace-nowrap'>RAM</p>
                                <p className='font-bold w-fit whitespace-nowrap'>
                                    {bytesToString(stats.memoryUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                        <div className={`sm:flex hidden`}>
                            <div className={`flex justify-center gap-2 w-fit`}>
                                <p className='text-sm text-[#ffffff66] font-bold w-fit whitespace-nowrap'>Storage</p>
                                <p className='font-bold w-fit whitespace-nowrap'>
                                    {bytesToString(stats.diskUsageInBytes, 0)}
                                </p>
                            </div>
                            {/* Pyro has unlimited storage */}
                            {/* ░░░░░▄▄▄▄▀▀▀▀▀▀▀▀▄▄▄▄▄▄░░░░░░░
                            ░░░░░█░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░▀▀▄░░░░
                            ░░░░█░░░▒▒▒▒▒▒░░░░░░░░▒▒▒░░█░░░
                            ░░░█░░░░░░▄██▀▄▄░░░░░▄▄▄░░░░█░░
                            ░▄▀▒▄▄▄▒░█▀▀▀▀▄▄█░░░██▄▄█░░░░█░
                            █░▒█▒▄░▀▄▄▄▀░░░░░░░░█░░░▒▒▒▒▒░█
                            █░▒█░█▀▄▄░░░░░█▀░░░░▀▄░░▄▀▀▀▄▒█
                            ░█░▀▄░█▄░█▀▄▄░▀░▀▀░▄▄▀░░░░█░░█░
                            ░░█░░░▀▄▀█▄▄░█▀▀▀▄▄▄▄▀▀█▀██░█░░
                            ░░░█░░░░██░░▀█▄▄▄█▄▄█▄████░█░░░
                            ░░░░█░░░░▀▀▄░█░░░█░█▀██████░█░░
                            ░░░░░▀▄░░░░░▀▀▄▄▄█▄█▄█▄█▄▀░░█░░
                            ░░░░░░░▀▄▄░▒▒▒▒░░░░░░░░░░▒░░░█░
                            ░░░░░░░░░░▀▀▄▄░▒▒▒▒▒▒▒▒▒▒░░░░█░
                            ░░░░░░░░░░░░░░▀▄▄▄▄▄░░░░░░░░█░░ */}
                            {/* <p className={`text-xs text-zinc-600 text-center mt-1`}>of {diskLimit}</p> */}
                        </div>
                    </Fragment>
                )}
            </div>
        </StatusIndicatorBox>
    );
};
