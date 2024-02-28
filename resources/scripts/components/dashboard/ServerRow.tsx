import React, { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-zinc-400`)};
`;

const StatusIndicatorBox = styled.div<{ $status: ServerPowerState | undefined }>`
    // background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.044) 100%);
    ${tw`shadow-md flex flex-row justify-between gap-4 relative px-8 py-7 border-[1px] border-[#ffffff07] rounded-xl transition-all duration-250 bg-[#ffffff11]`};

    &:hover {
        ${tw`border-[#ffffff11] bg-[#ffffff18]`};
    }

    & .status-bar {
        ${tw`w-3 h-3 min-h-3 min-w-3 bg-[#ffffff11] z-20 rounded-full transition-all duration-250`};
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

    // what the fuck
    // &:hover .status-bar {
    //     ${tw`opacity-75`};
    // }
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

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    return (
        <StatusIndicatorBox as={Link} to={`/server/${server.id}`} className={className} $status={stats?.status}>
            <div css={tw`flex items-center`}>
                {/* <div className={'icon mr-4'}>
                    <FontAwesomeIcon icon={faServer} />
                </div> */}
                <div className='flex flex-col'>
                    <div className='flex items-center justify-center gap-2'>
                        <p css={tw`text-xl tracking-tight font-bold break-words`}>{server.name}</p>{' '}
                        <div className={'status-bar'} />
                    </div>
                    <p css={tw`text-sm text-[#ffffff66]`}>
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </React.Fragment>
                            ))}
                    </p>
                    {/* I don't think servers will ever have descriptions normall so I'll vaporize it */}
                    {/* {!!server.description && <p css={tw`text-sm text-zinc-300 break-words `}>{server.description}</p>} */}
                </div>
            </div>
            <div
                css={tw`hidden sm:flex items-center justify-center bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-md w-fit whitespace-nowrap px-4 text-sm gap-4`}
            >
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div css={tw`flex-1 text-center`}>
                            <span css={tw`text-red-100 text-xs`}>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`flex-1 text-center`}>
                            <span css={tw`text-zinc-100 text-xs`}>
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
                    <React.Fragment>
                        <div css={tw`sm:flex hidden`}>
                            <div css={tw`flex justify-center gap-2 w-fit`}>
                                <p className='text-sm text-[#ffffff66] font-bold w-fit whitespace-nowrap'>CPU</p>
                                <p className='font-bold w-fit whitespace-nowrap'>{stats.cpuUsagePercent.toFixed(2)}%</p>
                            </div>
                            {/* <p css={tw`text-xs text-zinc-600 text-center mt-1`}>of {cpuLimit}</p> */}
                        </div>
                        <div css={tw`sm:flex hidden`}>
                            {/* <p css={tw`text-xs text-zinc-600 text-center mt-1`}>of {memoryLimit}</p> */}
                            <div css={tw`flex justify-center gap-2 w-fit`}>
                                <p className='text-sm text-[#ffffff66] font-bold w-fit whitespace-nowrap'>RAM</p>
                                <p className='font-bold w-fit whitespace-nowrap'>
                                    {bytesToString(stats.memoryUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                        <div css={tw`sm:flex hidden`}>
                            <div css={tw`flex justify-center gap-2 w-fit`}>
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
                            {/* <p css={tw`text-xs text-zinc-600 text-center mt-1`}>of {diskLimit}</p> */}
                        </div>
                    </React.Fragment>
                )}
            </div>
        </StatusIndicatorBox>
    );
};
