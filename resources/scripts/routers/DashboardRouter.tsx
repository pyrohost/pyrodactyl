import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

import routes from '@/routers/routes';

import DashboardContainer from '@/components/dashboard/DashboardContainer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import MainSidebar from '@/components/elements/MainSidebar';
import MainWrapper from '@/components/elements/MainWrapper';
import Logo from '@/components/elements/PyroLogo';
import { NotFound } from '@/components/elements/ScreenBlock';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import HugeIconsHome from '@/components/elements/hugeicons/Home';

import http from '@/api/http';
import StatusPage from '@/components/Additonal/statuspage';
import { AlarmClockCheckIcon, ArrowUpLeftFromCircleIcon, ClockArrowUp, LucideCalendarArrowUp, LucideHam, LucideHome, LucideLayoutDashboard, LucideSettings, LucideUserCircle2 } from 'lucide-react';
import DashPage from '@/components/dashboard';

export default () => {
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible); // Toggle sidebar visibility
    };

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const onSelectAdminPanel = () => {
        window.open(`/admin`);
    };

    // Define refs for navigation buttons.
    const NavigationHome = useRef(null);
    const NavigationSettings = useRef(null);
    const NavigationStatus = useRef(null);
    //const NavigationAccount = useRef(null);

    const calculateTop = (pathname: string) => {
        // Get currents of navigation refs.
        const ButtonHome = NavigationHome.current;
        const ButtonSettings = NavigationSettings.current;

        // Perfectly center the page highlighter with simple math.
        // Height of navigation links (56) minus highlight height (40) equals 16. 16 devided by 2 is 8.
        // very right, Decived
        const HighlightOffset: number = 8;

        if (pathname.endsWith(`/`) && ButtonHome != null) return (ButtonHome as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/account`) && ButtonSettings != null)
            return (ButtonSettings as any).offsetTop + HighlightOffset;
        return '0';
    };

    const top = calculateTop(location.pathname);

    const [height, setHeight] = useState('40px');

    useEffect(() => {
        setHeight('34px');
        const timeoutId = setTimeout(() => setHeight('40px'), 200);
        return () => clearTimeout(timeoutId);
    }, [top]);

    return (
        <Fragment key={'dashboard-router'}>
            <button
                id='sidebarToggle'
                className={`lg:hidden fixed top-4 left-4 z-50 bg-transparent p-2 rounded-md text-white ${
                    isSidebarVisible ? 'left-[300px]' : 'left-4'
                }`}
                onClick={toggleSidebar}
            >
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                    className='size-6'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                    />
                </svg>
            </button>

        
            <MainSidebar className={`
    fixed left-0 top-0 z-40 px-4 py-6 h-screen w-64 
    bg-zinc-950 border-r border-zinc-800
    transition-transform duration-300 ease-in-out
    lg:translate-x-0 lg:flex
    ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
`}>
    {/* Logo section */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <NavLink to={'/'} className="flex items-center gap-2">
            <Logo />
        </NavLink>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="rounded-md p-2 hover:bg-zinc-800 transition-colors">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="h-5 w-5"
                    >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                    </svg>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border border-zinc-800">
                {rootAdmin && (
                    <DropdownMenuItem className="flex items-center gap-2 text-sm">
                        Admin Panel
                        <span className="ml-auto text-xs bg-zinc-800 px-2 py-1 rounded">Staff</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-sm text-red-400">Log Out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>

    {/* Navigation section */}
    <nav className="py-4">
        <div className="">
            <NavLink 
                to="/" 
                end
                ref={NavigationHome}
                className={({isActive}) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm mb-1
                    transition-colors hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400'}
                `}
            >
                <LucideHome className="h-4 w-4" />
                <span>Servers</span>
            </NavLink>

            <NavLink 
                to="/account"
                end
                ref={NavigationSettings}
                className={({isActive}) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm mt-1
                    transition-colors hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400'}
                `}
            >
                <LucideUserCircle2 className="h-4 w-4" />
                <span>Settings / Account</span>
            </NavLink>

            <NavLink 
                to="/status"
                end
                ref={NavigationStatus}
                className={({isActive}) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm mt-1
                    transition-colors hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400'}
                `}
            >
                <AlarmClockCheckIcon className="h-4 w-4" />
                <span>Status</span>
            </NavLink>

            <NavLink 
                to="/dashboard"
                end
                className={({isActive}) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm mt-1
                    transition-colors hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400'}
                `}
            >
                <LucideLayoutDashboard className="h-4 w-4" />
                <span>Beta Dash</span>
            </NavLink>

            {rootAdmin && (
            <NavLink 
                to="/admin"
                end
                className={({isActive}) => `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm mt-1
                    transition-colors hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400'}
                `}
            >
                <LucideSettings className="h-4 w-4" />
                <span>Admin Panel</span>
                <span className="ml-auto text-xs bg-zinc-800 px-2 py-1 rounded">Staff</span>
            </NavLink>
        )}
        </div>
    </nav>
</MainSidebar>

            <Suspense fallback={null}>
                <MainWrapper>
                    <main
                        data-pyro-main=''
                        data-pyro-transitionrouter=''
                        className='relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]'
                    >
                        <Routes>
                            <Route path='' element={<DashboardContainer />} />

                            {routes.account.map(({ route, component: Component }) => (
                                <Route
                                    key={route}
                                    path={`/account/${route}`.replace('//', '/')}
                                    element={<Component />}
                                />
                            ))}

                            <Route path='*' element={<NotFound />} />
                            <Route path='/status' element={<StatusPage />} />
                            <Route path='/dashboard' element={<DashPage />} />

                        </Routes>
                    </main>
                </MainWrapper>
            </Suspense>
        </Fragment>
    );
};
