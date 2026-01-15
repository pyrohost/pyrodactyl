import { Ellipsis, Gear, House, Key, Lock } from "@gravity-ui/icons";
import { useStoreState } from "easy-peasy";
import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import http from "@/api/http";

import DashboardContainer from "@/components/dashboard/DashboardContainer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import MainSidebar from "@/components/elements/MainSidebar";
import MainWrapper from "@/components/elements/MainWrapper";
import { DashboardMobileMenu } from "@/components/elements/MobileFullScreenMenu";
import MobileTopBar from "@/components/elements/MobileTopBar";
import Logo from "@/components/elements/PyroLogo";
import { NotFound } from "@/components/elements/ScreenBlock";
import routes from "@/routers/routes";

const DashboardRouter = () => {
	const location = useLocation();
	const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

	// Mobile menu state
	const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);

	const toggleMobileMenu = () => {
		setMobileMenuVisible(!isMobileMenuVisible);
	};

	const closeMobileMenu = () => {
		setMobileMenuVisible(false);
	};

	const onTriggerLogout = () => {
		http.post("/auth/logout").finally(() => {
			// @ts-expect-error this is valid
			window.location = "/";
		});
	};

	const onSelectAdminPanel = () => {
		window.open(`/admin`);
	};

	// Define refs for navigation buttons.
	const NavigationHome = useRef(null);
	const NavigationSettings = useRef(null);
	const NavigationApi = useRef(null);
	const NavigationSSH = useRef(null);

	const calculateTop = (pathname: string) => {
		// Get currents of navigation refs.
		const ButtonHome = NavigationHome.current;
		const ButtonSettings = NavigationSettings.current;
		const ButtonApi = NavigationApi.current;
		const ButtonSSH = NavigationSSH.current;

		// Perfectly center the page highlighter with simple math.
		// Height of navigation links (56) minus highlight height (40) equals 16. 16 devided by 2 is 8.
		const HighlightOffset: number = 8;

		if (pathname.endsWith(`/`) && ButtonHome != null)
			return (ButtonHome as any).offsetTop + HighlightOffset;
		if (pathname.endsWith(`/account`) && ButtonSettings != null)
			return (ButtonSettings as any).offsetTop + HighlightOffset;
		if (pathname.endsWith("/api") && ButtonApi != null)
			return (ButtonApi as any).offsetTop + HighlightOffset;
		if (pathname.endsWith("/ssh") && ButtonSSH != null)
			return (ButtonSSH as any).offsetTop + HighlightOffset;
		return "0";
	};

	const top = calculateTop(location.pathname);

	const [height, setHeight] = useState("40px");

	useEffect(() => {
		setHeight("34px");
		const timeoutId = setTimeout(() => setHeight("40px"), 200);
		return () => clearTimeout(timeoutId);
	}, [top]);

	return (
		<Fragment key={"dashboard-router"}>
			{/* Mobile Top Bar */}
			<MobileTopBar
				onMenuToggle={toggleMobileMenu}
				onTriggerLogout={onTriggerLogout}
				onSelectAdminPanel={onSelectAdminPanel}
				rootAdmin={rootAdmin}
			/>

			{/* Mobile Full Screen Menu */}
			<DashboardMobileMenu
				isVisible={isMobileMenuVisible}
				onClose={closeMobileMenu}
			/>

			<div className="flex flex-row w-full lg:pt-0 pt-16">
				{/* Desktop Sidebar */}
				<MainSidebar className="hidden lg:flex lg:relative lg:shrink-0 w-[300px] bg-[#1a1a1a]">
					<div
						className="absolute bg-brand w-[3px] h-10 left-0 rounded-full pointer-events-none "
						style={{
							top,
							height,
							opacity: top === "0" ? 0 : 1,
							transition:
								"linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms",
						}}
					/>
					<div
						className="absolute bg-brand w-12 h-10 blur-2xl left-0 rounded-full pointer-events-none"
						style={{
							top,
							opacity: top === "0" ? 0 : 0.5,
							transition:
								"top linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms",
						}}
					/>
					<div className="relative flex flex-row items-center justify-between h-8">
						<NavLink to={"/"} className="flex shrink-0 h-8 w-fit">
							<Logo uniqueId="desktop-sidebar" />
							{/* <h1 className='text-[35px] font-semibold leading-[98%] tracking-[-0.05rem] mb-8'>Panel</h1> */}
						</NavLink>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-white/10 p-2 cursor-pointer">
									{" "}
									<Ellipsis fill="currentColor" width={26} height={22} />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="z-99999" sideOffset={8}>
								{rootAdmin && (
									<DropdownMenuItem onSelect={onSelectAdminPanel}>
										Admin Panel
										<span className="ml-2 z-10 rounded-full bg-brand px-2 py-1 text-xs text-white">
											Staff
										</span>
									</DropdownMenuItem>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem onSelect={onTriggerLogout}>
									Log Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div
						aria-hidden
						className="mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-6"
					></div>
					<ul
						data-pyro-subnav-routes-wrapper=""
						className="pyro-subnav-routes-wrapper"
					>
						<NavLink
							to={"/"}
							end
							className="flex flex-row items-center"
							ref={NavigationHome}
						>
							<House width={22} height={22} fill="currentColor" />
							<p>Servers</p>
						</NavLink>
						<NavLink
							to={"/account/api"}
							end
							className="flex flex-row items-center"
							ref={NavigationApi}
						>
							<Lock width={22} height={22} fill="currentColor" />
							<p>API Keys</p>
						</NavLink>
						<NavLink
							to={"/account/ssh"}
							end
							className="flex flex-row items-center"
							ref={NavigationSSH}
						>
							<Key width={22} height={22} fill="currentColor" />
							<p>SSH Keys</p>
						</NavLink>
						<NavLink
							to={"/account"}
							end
							className="flex flex-row items-center"
							ref={NavigationSettings}
						>
							<Gear width={22} height={22} fill="currentColor" />
							<p>Settings</p>
						</NavLink>
					</ul>
				</MainSidebar>

				<Suspense fallback={null}>
					<MainWrapper className="w-full">
						<main
							data-pyro-main=""
							data-pyro-transitionrouter=""
							className="relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]"
						>
							<Routes>
								<Route path="" element={<DashboardContainer />} />

								{routes.account.map(({ route, component: Component }) => (
									<Route
										key={route}
										path={`/account/${route}`.replace("//", "/")}
										element={<Component />}
									/>
								))}

								<Route path="*" element={<NotFound />} />
							</Routes>
						</main>
					</MainWrapper>
				</Suspense>
			</div>
		</Fragment>
	);
};

export default DashboardRouter;
