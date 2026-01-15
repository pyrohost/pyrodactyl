import { LayoutSideContent } from "@gravity-ui/icons";
import { Fragment, memo } from "react";
import { NavLink } from "react-router-dom";
// import ActionButton from '@/components/elements/ActionButton';
import Logo from "@/components/elements/PyroLogo";
import { Button } from "@/components/ui/button";
import { useHeader } from "@/contexts/HeaderContext";
import { useSidebar } from "@/contexts/SidebarContext";

import "../sidebar/sidebar-modern.css";
import UserDropdown from "./UserDropdown";

interface AppHeaderProps {
	serverId?: string;
}

const HeaderActions = memo(() => {
	const { headerActions } = useHeader();

	if (Array.isArray(headerActions)) {
		return (
			<>
				{headerActions.map((action, index) => (
					<Fragment key={index}>{action}</Fragment>
				))}
			</>
		);
	}

	return <>{headerActions}</>;
});

HeaderActions.displayName = "HeaderActions";

const LogoSection = memo(() => (
	<NavLink
		to={"/"}
		className="flex items-center shrink-0 h-4 w-fit pyro-logo"
		aria-label="Home page"
	>
		<Logo />
	</NavLink>
));
LogoSection.displayName = "LogoSection";

const ToggleButton = memo(() => {
	const { toggleMinimized } = useSidebar();

	return (
		<Button
			variant={"secondary"}
			size={"sm"}
			className="p-1 gap-1 rounded-full size-8"
			aria-label="Toggle sidebar"
			onClick={toggleMinimized}
		>
			<LayoutSideContent width={16} height={16} />
		</Button>
	);
});
ToggleButton.displayName = "ToggleButton";

const SidebarLogo = memo(() => {
	return (
		<div className="sidebar-logo-container h-[48px] items-center justify-between mx-8 flex flex-none">
			<LogoSection />
			<ToggleButton />
		</div>
	);
});
SidebarLogo.displayName = "SidebarLogo";

const StaticButtons = memo<{ serverId?: string }>(({ serverId }) => {
	return (
		<>
			{/* <Button size={'sm'} variant={'secondary'} className='px-3 gap-1 rounded-full'>
                <div className='flex flex-row items-center gap-1.5'>
                    <HugeiconsIcon size={16} strokeWidth={2} icon={AiSearch02Icon} className='size-4' />
                    Search
                </div>
            </Button> */}
			<UserDropdown serverId={serverId} />
		</>
	);
});

StaticButtons.displayName = "StaticButtons";

const AppHeader = ({ serverId }: AppHeaderProps) => {
	return (
		<div className="h-[64px] w-full py-4 pr-2 flex align-middle items-center justify-between">
			<SidebarLogo />
			<div className="flex items-center gap-2 h-full w-full justify-end">
				<HeaderActions />
				<StaticButtons serverId={serverId} />
			</div>
		</div>
	);
};

export default AppHeader;
