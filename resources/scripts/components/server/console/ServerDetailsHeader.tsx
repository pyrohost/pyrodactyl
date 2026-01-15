import { useEffect, useMemo, useState } from "react";

import { SocketEvent, SocketRequest } from "@/components/server/events";
import { Skeleton } from "@/components/ui/skeleton";

import { bytesToString, ip, mbToBytes } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import useWebsocketEvent from "@/plugins/useWebsocketEvent";
import { ServerContext } from "@/state/server";

type Stats = Record<"memory" | "cpu" | "disk" | "uptime" | "rx" | "tx", number>;

// @ts-expect-error - Unused parameter in component definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Limit = ({
	limit,
	children,
}: {
	limit: string | null;
	children: React.ReactNode;
}) => <>{children}</>;

const ServerDetailsHeader = ({ className }: { className?: string }) => {
	const [stats, setStats] = useState<Stats>({
		memory: 0,
		cpu: 0,
		disk: 0,
		uptime: 0,
		tx: 0,
		rx: 0,
	});
	const [loading, setLoading] = useState(true); // Added loading state

	const status = ServerContext.useStoreState((state) => state.status.value);
	const connected = ServerContext.useStoreState(
		(state) => state.socket.connected,
	);
	const instance = ServerContext.useStoreState(
		(state) => state.socket.instance,
	);
	const limits = ServerContext.useStoreState(
		(state) => state.server.data!.limits,
	);

	const textLimits = useMemo(
		() => ({
			cpu: limits?.cpu ? `${limits.cpu}%` : null,
			memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
			disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
		}),
		[limits],
	);

	const allocation = ServerContext.useStoreState((state) => {
		const match = state.server.data!.allocations.find(
			(allocation) => allocation.isDefault,
		);

		return !match ? "n/a" : `${match.alias || ip(match.ip)}:${match.port}`;
	});

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
		setLoading(false); // Set loading to false once stats are received
	});

	interface DetailProps {
		label: string;
		loading?: boolean;
		children?: React.ReactNode;
		className?: string;
	}

	const Detail = ({ label, loading, children, className }: DetailProps) => {
		return (
			<div className={cn("flex flex-col", className)}>
				<span className="font-bold uppercase text-cream-400/50 text-xs">
					{label}
				</span>
				<span className={`text-sm`}>
					{loading ? <Skeleton className="w-full h-[1lh]" /> : children}
				</span>
			</div>
		);
	};

	return (
		<div
			className={cn("flex md:flex-row gap-4 flex-col text-nowrap", className)}
		>
			<Detail label={"CPU"} className="w-14" loading={loading}>
				{`${stats.cpu.toFixed(2)}%`}
			</Detail>
			<Detail label={"RAM"} className="w-14" loading={loading}>
				{bytesToString(stats.memory, undefined, "GiB")}
			</Detail>
			<Detail label={"Disk"} className="w-20" loading={loading}>
				{bytesToString(stats.disk)}
			</Detail>
		</div>
	);
};

export default ServerDetailsHeader;
