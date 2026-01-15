import { cn } from "@/lib/utils";

import { ServerContext } from "@/state/server";

export const StatusPillHeader = () => {
	const status = ServerContext.useStoreState((state) => state.status.value);

	return (
		<div className={cn("relative transition rounded-full flex items-center")}>
			<div
				className={cn(
					"transition rounded-full h-4 w-4",
					status === "offline"
						? "bg-red-500"
						: status === "running"
							? "bg-green-500"
							: "bg-yellow-500",
				)}
			></div>
			<div
				className={cn(
					"transition rounded-full h-4 w-4 animate-ping absolute opacity-45",
					status === "offline"
						? "hidden"
						: status === "running"
							? "bg-green-500"
							: "bg-yellow-500",
				)}
			></div>
			<div className={`text-sm font-bold hidden`}>
				{status === "offline"
					? "Offline"
					: status === "running"
						? "Online"
						: status === "stopping"
							? "Stopping"
							: status === "starting"
								? "Starting"
								: "Fetching"}
			</div>
		</div>
	);
};
