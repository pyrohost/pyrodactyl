import {
	Box,
	BranchesDown,
	ClockArrowRotateLeft,
	CloudArrowUpIn,
	Database,
	FolderOpen,
	Gear,
	House,
	PencilToLine,
	Persons,
	Power,
	Terminal,
} from "@gravity-ui/icons";
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Can from "@/components/elements/Can";

import { ServerContext } from "@/state/server";

import ModrinthLogo from "../ModrinthLogo";

const CommandMenu = () => {
	const [open, setOpen] = useState(false);
	const id = ServerContext.useStoreState((state) => state.server.data?.id);
	const navigate = useNavigate();
	// controls server power status
	const status = ServerContext.useStoreState((state) => state.status.value);
	const instance = ServerContext.useStoreState(
		(state) => state.socket.instance,
	);

	const cmdkPowerAction = (action: string) => {
		if (instance) {
			if (action === "start") {
				toast.success("Your server is starting!");
			} else if (action === "restart") {
				toast.success("Your server is restarting.");
			} else {
				toast.success("Your server is being stopped.");
			}
			setOpen(false);
			instance.send("set state", action === "kill-confirmed" ? "kill" : action);
		}
	};

	const cmdkNavigate = (url: string) => {
		navigate("/server/" + id + url);
		setOpen(false);
	};

	useEffect(() => {
		const down = (e) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<Command.Dialog
			open={open}
			onOpenChange={setOpen}
			label="Global Command Menu"
		>
			<Command.Input />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>

				<Command.Group heading="Pages">
					<Command.Item onSelect={() => cmdkNavigate("")}>
						<House fill="currentColor" />
						Home
					</Command.Item>
					<Can action={"file.*"} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/files")}>
							<FolderOpen fill="currentColor" />
							Files
						</Command.Item>
					</Can>
					<Can action={"database.*"} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/databases")}>
							<Database fill="currentColor" />
							Databases
						</Command.Item>
					</Can>
					<Can action={"backup.*"} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/backups")}>
							<CloudArrowUpIn fill="currentColor" />
							Backups
						</Command.Item>
					</Can>
					<Can action={"allocation.*"} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/network")}>
							<BranchesDown fill="currentColor" />
							Networking
						</Command.Item>
					</Can>
					<Can action={"user.*"} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/users")}>
							<Persons fill="currentColor" />
							Users
						</Command.Item>
					</Can>
					<Can action={["startup.*"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/startup")}>
							<Terminal fill="currentColor" />
							Startup
						</Command.Item>
					</Can>
					<Can action={["schedule.*"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/schedules")}>
							<ClockArrowRotateLeft fill="currentColor" />
							Schedules
						</Command.Item>
					</Can>
					<Can action={["settings.*", "file.sftp"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/settings")}>
							<Gear fill="currentColor" />
							Settings
						</Command.Item>
					</Can>
					<Can action={["activity.*"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/activity")}>
							<PencilToLine fill="currentColor" />
							Activity
						</Command.Item>
					</Can>
					<Can action={["modrinth.*"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/mods")}>
							<ModrinthLogo />
							Mods/Plugins
						</Command.Item>
					</Can>
					<Can action={["software.*"]} matchAny>
						<Command.Item onSelect={() => cmdkNavigate("/shell")}>
							<Box fill="currentColor" />
							Software
						</Command.Item>
					</Can>
				</Command.Group>
				<Command.Group heading="Server">
					<Can action={"control.start"}>
						<Command.Item
							disabled={status !== "offline"}
							onSelect={() => cmdkPowerAction("start")}
						>
							<Power fill="currentColor" />
							Start Server
						</Command.Item>
					</Can>
					<Can action={"control.restart"}>
						<Command.Item
							disabled={!status}
							onSelect={() => cmdkPowerAction("restart")}
						>
							<Power fill="currentColor" />
							Restart Server
						</Command.Item>
					</Can>
					<Can action={"control.restart"}>
						<Command.Item
							disabled={status === "offline"}
							onSelect={() => cmdkPowerAction("stop")}
						>
							<Power fill="currentColor" />
							Stop Server
						</Command.Item>
					</Can>
				</Command.Group>
			</Command.List>
		</Command.Dialog>
	);
};

export default CommandMenu;
