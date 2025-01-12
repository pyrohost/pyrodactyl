import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { debounce } from 'lodash';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import LogoLoader from '@/components/elements/ServerLoad';

interface ServerStats {
    attributes: {
        resources: {
            cpu_absolute: number;
            memory_bytes: number;
            disk_bytes: number;
            network_rx_bytes: number;
            network_tx_bytes: number;
        }
    }
}

interface StatChartsProps {
    serverId: string;
}

const StatCharts = ({ serverId }: StatChartsProps) => {
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const eventSourceRef = useRef<EventSource | null>(null);

    const [chartData, setChartData] = useState<Array<{
        timestamp: string;
        cpu: number;
        memory: number;
        disk: number;
        networkRx: number;
        networkTx: number;
    }>>([]);

    const updateChartData = useCallback((newStats: ServerStats) => {
        const timestamp = new Date().toLocaleTimeString();
        const cpu = newStats?.attributes.resources.cpu_absolute || 0;
        const memory = (newStats?.attributes.resources.memory_bytes || 0) / (1024 * 1024); // Convert bytes to MB
        const disk = (newStats?.attributes.resources.disk_bytes || 0) / (1024 * 1024);
        const networkRx = (newStats?.attributes.resources.network_rx_bytes || 0) / (1024 * 1024);
        const networkTx = (newStats?.attributes.resources.network_tx_bytes || 0) / (1024 * 1024);

        setChartData(prev => [...prev.slice(-19), { timestamp, cpu, memory, disk, networkRx, networkTx }]);
    }, []);

    const debouncedUpdateCharts = useCallback(
        debounce((data: ServerStats) => {
            updateChartData(data);
        }, 100),
        [updateChartData]
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
                    setStats(data);
                    debouncedUpdateCharts(data);
                    setIsLoading(false);
                } catch (err) {
                    console.error('Error parsing stats:', err);
                    setError('Failed to parse server stats');
                }
            };

            eventSourceRef.current.onerror = () => {
                setError('Connection lost');
                setIsLoading(true);
                setTimeout(setupEventSource, 5000);
            };
        } catch (err) {
            console.error('Failed to setup EventSource:', err);
            setError('Failed to connect to server');
        }
    }, [serverId, debouncedUpdateCharts]);

    useEffect(() => {
        setupEventSource();
        return () => {
            eventSourceRef.current?.close();
            debouncedUpdateCharts.cancel();
        };
    }, [setupEventSource]);

    const renderChart = (dataKey: string, label: string, color: string, unit: string) => (
        <ChartContainer
            config={{
                [dataKey]: {
                    label: label,
                    color: color,
                },
            }}
            className="h-[200px] w-full"
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <XAxis
                        dataKey="timestamp"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}${unit}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        strokeWidth={2}
                        activeDot={{
                            r: 6,
                            style: { fill: color, opacity: 0.8 },
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );

    return (
        <div className="grid gap-4 grid-cols-2">
            <Card className='w-full'>
                <CardHeader>
                    <CardTitle>CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <LogoLoader size='80px' className='animate-pulse'/>
                        </div>
                    ) : (
                        renderChart("cpu", "CPU Usage", "hsl(var(--chart-1))", "%")
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <LogoLoader size='80px'/>
                        </div>
                    ) : (
                        renderChart("memory", "Memory Usage", "hsl(var(--chart-2))", "MB")
                    )}
                </CardContent>
            </Card>
    
            <Card>
                <CardHeader>
                    <CardTitle>Disk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <LogoLoader size='80px'/>
                        </div>
                    ) : (
                        renderChart("disk", "Disk Usage", "hsl(var(--chart-3))", "MB")
                    )}
                </CardContent>
            </Card>
    
            <Card>
                <CardHeader>
                    <CardTitle>Network Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <LogoLoader size='80px'/>
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                networkRx: {
                                    label: "Network RX",
                                    color: "hsl(var(--chart-4))",
                                },
                                networkTx: {
                                    label: "Network TX",
                                    color: "hsl(var(--chart-5))",
                                },
                            }}
                            className="h-[200px] w-full"
                        >
                            <ResponsiveContainer width="220%" height="100%">
                                <LineChart data={chartData}>
                                    <XAxis
                                        dataKey="timestamp"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}MB/s`}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="networkRx"
                                        strokeWidth={2}
                                        activeDot={{
                                            r: 6,
                                            style: { fill: "hsl(var(--chart-4))", opacity: 0.8 },
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="networkTx"
                                        strokeWidth={2}
                                        activeDot={{
                                            r: 6,
                                            style: { fill: "hsl(var(--chart-5))", opacity: 0.8 },
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StatCharts;

