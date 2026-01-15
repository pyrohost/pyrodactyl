import { CloudDownload, CloudUpload } from '@carbon/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

import ChartBlock from '@/components/server/console/ChartBlock';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { SocketEvent } from '@/components/server/events';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { bytesToString, ip } from '@/lib/formatters';
import { hexToRgba } from '@/lib/helpers';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

import formatUptime from '../UptimeDuration';

interface StatsData {
    cpu_absolute: number;
    memory_bytes: number;
    uptime: number;
    network: {
        tx_bytes: number;
        rx_bytes: number;
    };
}

const StatGraphs = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('CPU', limits.cpu, '%', 2);
    const [uptime, setUptime] = useState(0);
    const memory = useChartTickLabel('Memory', limits.memory, 'MiB');
    const network = useChart('Network', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Network In' : 'Network Out',
                borderColor: !index ? '#facc15' : '#60a5fa',
                backgroundColor: hexToRgba(!index ? '#facc15' : '#60a5fa', 0.09),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
            setUptime(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: StatsData;
        try {
            values = JSON.parse(data) as StatsData;
        } catch {
            return;
        }
        setUptime(values.uptime);
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));

        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = {
            tx: values.network.tx_bytes,
            rx: values.network.rx_bytes,
        };
    });

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    const description = ServerContext.useStoreState((state) => state.server.data!.description);

    return (
        <TooltipProvider>
            <div className='flex h-full flex-col gap-4 overflow-y-auto flex-none'>
                <div>
                    <div className='group p-4 justify-between relative rounded-xl border-[1px] border-[#ffffff11] bg-[#110f0d] flex gap-4 text-sm'>
                        <h3 className='font-extrabold'>IP Address</h3>
                        <div className='font-medium'>{allocation}</div>
                    </div>
                </div>
                <div>
                    <div className='group p-4 justify-between relative rounded-xl border-[1px] border-[#ffffff11] bg-[#110f0d] flex gap-4 text-sm'>
                        <h3 className='font-extrabold'>Uptime</h3>
                        <div className='font-medium'>{formatUptime(uptime)}</div>
                    </div>
                </div>
                {description && (
                    <div>
                        <div className='group p-4 justify-between relative rounded-xl border-[1px] border-[#ffffff11] flex-col bg-[#110f0d] flex gap-4 text-sm'>
                            <h3 className='font-extrabold'>Description</h3>
                            <div className='font-medium'>{description}</div>
                        </div>
                    </div>
                )}
                <div>
                    <ChartBlock title={'CPU'}>
                        <Line aria-label='CPU Usage' role='img' {...cpu.props} />
                    </ChartBlock>
                </div>
                <div>
                    <ChartBlock title={'RAM'}>
                        <Line aria-label='Memory Usage' role='img' {...memory.props} />
                    </ChartBlock>
                </div>
                <div>
                    <ChartBlock
                        title={'Network Activity'}
                        legend={
                            <div className='flex gap-2'>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <CloudDownload className='mr-2 w-4 h-4 text-yellow-400' />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side='top' sideOffset={5}>
                                        Inbound
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <div className='flex items-center cursor-default'>
                                            <CloudUpload className='w-4 h-4 text-blue-400' />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side='top' sideOffset={5}>
                                        Outbound
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        }
                    >
                        <Line
                            aria-label='Network Activity. Download and upload activity'
                            role='img'
                            {...network.props}
                        />
                    </ChartBlock>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default StatGraphs;
