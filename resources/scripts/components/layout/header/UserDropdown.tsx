import {
	ArrowDown01Icon,
	Logout03Icon,
	ServerStack02Icon,
	Settings02Icon,
	UserShield02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStoreState } from "easy-peasy";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { sha256Hash } from "@/lib/helpers";

import http from "@/api/http";

import { Button } from "../../ui/button";

export interface UserDropdownMenuItem {
	id: string;
	label?: string;
	icon?: React.ComponentType<any>;
	badge?: string;
	onSelect?: () => void;
	showWhen?: boolean;
	type?: "item" | "separator";
	link?: {
		href: string;
		external?: boolean;
	};
}

interface UserDropdownProps {
	serverId?: string;
}

export default function UserDropdown({ serverId }: UserDropdownProps) {
	const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
	const email = useStoreState((state) => state.user.data!.email);
	const navigate = useNavigate();
	const [emailHash, setEmailHash] = useState<string>("");

	useEffect(() => {
		const computeEmailHash = async () => {
			const hash = await sha256Hash(email.toLowerCase().trim());
			setEmailHash(hash);
		};

		if (email) {
			computeEmailHash();
		}
	}, [email]);

	const onTriggerLogout = () => {
		http.post("/auth/logout").finally(() => {
			// @ts-expect-error this is valid
			window.location = "/";
		});
	};

	const defaultMenuItems: UserDropdownMenuItem[] = [
		{
			id: "user-settings",
			label: "Settings",
			icon: () => (
				<HugeiconsIcon size={16} strokeWidth={2} icon={Settings02Icon} />
			),
			link: {
				href: "/account",
				external: false,
			},
			type: "item",
		},
		{
			id: "admin-separator",
			type: "separator",
			showWhen: rootAdmin,
		},
		{
			id: "admin-panel",
			label: "Admin Panel",
			icon: () => (
				<HugeiconsIcon size={16} strokeWidth={2} icon={UserShield02Icon} />
			),
			badge: "Staff",
			link: {
				href: "/admin",
				external: true,
			},
			showWhen: rootAdmin,
			type: "item",
		},
		{
			id: "logout",
			label: "Log Out",
			icon: () => (
				<HugeiconsIcon size={16} strokeWidth={2} icon={Logout03Icon} />
			),
			onSelect: onTriggerLogout,
			type: "item",
		},
	];

	const menuItems = [...defaultMenuItems];

	// add server management item if serverId is provided
	if (serverId && rootAdmin) {
		const manageServerItem: UserDropdownMenuItem = {
			id: "manage-server",
			label: "Manage Server",
			icon: () => (
				<HugeiconsIcon size={16} strokeWidth={2} icon={ServerStack02Icon} />
			),
			link: {
				href: `/admin/servers/view/${serverId}`,
				external: true,
			},
			badge: "Staff",
			type: "item",
		};

		// insert after admin separator
		const adminSeparatorIndex = menuItems.findIndex(
			(item) => item.id === "admin-separator",
		);
		if (adminSeparatorIndex !== -1) {
			menuItems.splice(adminSeparatorIndex + 1, 0, manageServerItem);
		} else {
			// if no admin separator, add at the beginning
			menuItems.unshift(manageServerItem);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={"secondary"}
					size={"sm"}
					className="px-1 gap-1 rounded-full"
				>
					<div className="flex flex-row items-center gap-1.5">
						<div className="grid aspect-square size-5 place-content-center overflow-hidden rounded-full border border-mocha-400 bg-mocha-400">
							<img
								src={`https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=32`}
								alt="User avatar"
								className="w-full h-full object-cover"
								draggable={false}
							/>
						</div>
						{email}
					</div>
					<HugeiconsIcon size={16} strokeWidth={2} icon={ArrowDown01Icon} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-99999" sideOffset={8}>
				{menuItems
					.filter((item) => item.showWhen !== false)
					.map((item) => {
						if (item.type === "separator") {
							return <DropdownMenuSeparator key={item.id} />;
						}

						const IconComponent = item.icon;

						const handleSelect = () => {
							if (item.link) {
								if (item.link.external) {
									window.open(item.link.href, "_blank");
								} else {
									navigate(item.link.href);
								}
							} else if (item.onSelect) {
								item.onSelect();
							}
						};

						return (
							<DropdownMenuItem
								key={item.id}
								onSelect={handleSelect}
								className={`flex items-center gap-2 ${item.link?.external ? "cursor-pointer" : ""}`}
							>
								{IconComponent && <IconComponent className="size-4" />}
								{item.label}
								{item.badge && (
									<span className="ml-auto z-10 rounded-full bg-brand px-2 py-1 text-xs text-white">
										{item.badge}
									</span>
								)}
							</DropdownMenuItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
