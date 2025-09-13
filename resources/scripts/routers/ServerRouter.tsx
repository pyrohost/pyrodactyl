'use client';

import { useStoreState } from 'easy-peasy';
import { on } from 'events';
import React, { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';

import routes from '@/routers/routes';

import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import MainSidebar from '@/components/elements/MainSidebar';
import MainWrapper from '@/components/elements/MainWrapper';
import { ServerMobileMenu } from '@/components/elements/MobileFullScreenMenu';
import MobileTopBar from '@/components/elements/MobileTopBar';
import PermissionRoute from '@/components/elements/PermissionRoute';
import Logo from '@/components/elements/PyroLogo';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import CommandMenu from '@/components/elements/commandk/CmdK';
import HugeIconsClock from '@/components/elements/hugeicons/Clock';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsConnections from '@/components/elements/hugeicons/Connections';
import HugeIconsConsole from '@/components/elements/hugeicons/Console';
import HugeIconsController from '@/components/elements/hugeicons/Controller';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsFolder from '@/components/elements/hugeicons/Folder';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import HugeIconsPeople from '@/components/elements/hugeicons/People';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
import { getSubdomainInfo, SubdomainInfo } from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

const blank_egg_prefix = '@';

// Sidebar item components that check both permissions and feature limits
const DatabasesSidebarItem = React.forwardRef<HTMLAnchorElement, { id: string; onClick: () => void }>(
    ({ id, onClick }, ref) => {
        const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases ?? 0);

        // Hide if no database access (limit is 0)
        if (databaseLimit === 0) return null;

        return (
            <Can action={'database.*'} matchAny>
                <NavLink
                    className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                    ref={ref}
                    to={`/server/${id}/databases`}
                    onClick={onClick}
                    end
                >
                    <HugeIconsDatabase fill='currentColor' />
                    <p>Databases</p>
                </NavLink>
            </Can>
        );
    },
);
DatabasesSidebarItem.displayName = 'DatabasesSidebarItem';

const BackupsSidebarItem = React.forwardRef<HTMLAnchorElement, { id: string; onClick: () => void }>(
    ({ id, onClick }, ref) => {
        const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups ?? 0);

        // Hide if no backup access (limit is 0)
        if (backupLimit === 0) return null;

        return (
            <Can action={'backup.*'} matchAny>
                <NavLink
                    className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                    ref={ref}
                    to={`/server/${id}/backups`}
                    onClick={onClick}
                    end
                >
                    <HugeIconsCloudUp fill='currentColor' />
                    <p>Backups</p>
                </NavLink>
            </Can>
        );
    },
);
BackupsSidebarItem.displayName = 'BackupsSidebarItem';

const NetworkingSidebarItem = React.forwardRef<HTMLAnchorElement, { id: string; onClick: () => void }>(
    ({ id, onClick }, ref) => {
        const [subdomainSupported, setSubdomainSupported] = useState(false);
        const allocationLimit = ServerContext.useStoreState(
            (state) => state.server.data?.featureLimits.allocations ?? 0,
        );
        const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

        useEffect(() => {
            const checkSubdomainSupport = async () => {
                try {
                    if (uuid) {
                        const data = await getSubdomainInfo(uuid);
                        setSubdomainSupported(data.supported);
                    }
                } catch (error) {
                    setSubdomainSupported(false);
                }
            };

            checkSubdomainSupport();
        }, [uuid]);

        // Show if either allocations are available OR subdomains are supported
        if (allocationLimit === 0 && !subdomainSupported) return null;

        return (
            <Can action={'allocation.*'} matchAny>
                <NavLink
                    className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                    ref={ref}
                    to={`/server/${id}/network`}
                    onClick={onClick}
                    end
                >
                    <HugeIconsConnections fill='currentColor' />
                    <p>Networking</p>
                </NavLink>
            </Can>
        );
    },
);
NetworkingSidebarItem.displayName = 'NetworkingSidebarItem';

/**
 * Creates a swipe event from an X and Y location at start and current co-ords.
 * Important to create a shared, but not public, space for methods.
 *
 * @class
 */

const ServerRouter = () => {
    const params = useParams<'id'>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');
    const [subdomainSupported, setSubdomainSupported] = useState(false);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);
    const egg_id = ServerContext.useStoreState((state) => state.server.data?.egg);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases ?? 0);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups ?? 0);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.allocations ?? 0);

    // Mobile menu state
    const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuVisible(!isMobileMenuVisible);
    };

    const closeMobileMenu = () => {
        setMobileMenuVisible(false);
    };

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const onSelectManageServer = () => {
        window.open(`/admin/servers/view/${serverId}`);
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        [],
    );

    useEffect(() => {
        setError('');

        if (params.id === undefined) {
            return;
        }

        getServer(params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [params.id]);

    useEffect(() => {
        const checkSubdomainSupport = async () => {
            try {
                if (uuid) {
                    const data = await getSubdomainInfo(uuid);
                    setSubdomainSupported(data.supported);
                }
            } catch (error) {
                setSubdomainSupported(false);
            }
        };

        if (uuid) {
            checkSubdomainSupport();
        }
    }, [uuid]);

    // Define refs for navigation buttons.
    const NavigationHome = useRef(null);
    const NavigationFiles = useRef(null);
    const NavigationDatabases = useRef(null);
    const NavigationBackups = useRef(null);
    const NavigationNetworking = useRef(null);
    const NavigationUsers = useRef(null);
    const NavigationStartup = useRef(null);
    const NavigationSchedules = useRef(null);
    const NavigationSettings = useRef(null);
    const NavigationActivity = useRef(null);
    const NavigationMod = useRef(null);
    const NavigationShell = useRef(null);

    const calculateTop = (pathname: string) => {
        if (!id) return '0';

        // Get currents of navigation refs.
        const ButtonHome = NavigationHome.current;
        const ButtonFiles = NavigationFiles.current;
        const ButtonDatabases = NavigationDatabases.current;
        const ButtonBackups = NavigationBackups.current;
        const ButtonNetworking = NavigationNetworking.current;
        const ButtonUsers = NavigationUsers.current;
        const ButtonStartup = NavigationStartup.current;
        const ButtonSchedules = NavigationSchedules.current;
        const ButtonSettings = NavigationSettings.current;
        const ButtonShell = NavigationShell.current;
        const ButtonActivity = NavigationActivity.current;
        const ButtonMod = NavigationMod.current;

        // Perfectly center the page highlighter with simple math.
        // Height of navigation links (56) minus highlight height (40) equals 16. 16 devided by 2 is 8.
        const HighlightOffset: number = 8;

        if (pathname.endsWith(`/server/${id}`) && ButtonHome != null)
            return (ButtonHome as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/files`) && ButtonFiles != null)
            return (ButtonFiles as any).offsetTop + HighlightOffset;
        if (new RegExp(`^/server/${id}/files(/(new|edit).*)?$`).test(pathname) && ButtonFiles != null)
            return (ButtonFiles as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/databases`) && ButtonDatabases != null)
            return (ButtonDatabases as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/backups`) && ButtonBackups != null)
            return (ButtonBackups as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/network`) && ButtonNetworking != null)
            return (ButtonNetworking as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/users`) && ButtonUsers != null)
            return (ButtonUsers as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/startup`) && ButtonStartup != null)
            return (ButtonStartup as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/schedules`) && ButtonSchedules != null)
            return (ButtonSchedules as any).offsetTop + HighlightOffset;
        if (new RegExp(`^/server/${id}/schedules/\\d+$`).test(pathname) && ButtonSchedules != null)
            return (ButtonSchedules as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/settings`) && ButtonSettings != null)
            return (ButtonSettings as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/shell`) && ButtonShell != null)
            return (ButtonShell as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/activity`) && ButtonActivity != null)
            return (ButtonActivity as any).offsetTop + HighlightOffset;
        if (pathname.endsWith(`/server/${id}/mods`) && ButtonMod != null)
            return (ButtonMod as any).offsetTop + HighlightOffset;

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
        <Fragment key={'server-router'}>
            {!uuid || !id ? (
                error ? (
                    <ServerError title='Something went wrong' message={error} />
                ) : null
            ) : (
                <>
                    {/* Mobile Top Bar */}
                    <MobileTopBar
                        onMenuToggle={toggleMobileMenu}
                        onTriggerLogout={onTriggerLogout}
                        onSelectAdminPanel={onSelectManageServer}
                        rootAdmin={rootAdmin}
                    />

                    {/* Mobile Full Screen Menu */}
                    <ServerMobileMenu
                        isVisible={isMobileMenuVisible}
                        onClose={closeMobileMenu}
                        serverId={id}
                        databaseLimit={databaseLimit}
                        backupLimit={backupLimit}
                        allocationLimit={allocationLimit}
                        subdomainSupported={subdomainSupported}
                    />

                    <div className='flex flex-row w-full lg:pt-0 pt-16'>
                        {/* Desktop Sidebar */}
                        <MainSidebar className='hidden lg:flex lg:relative lg:shrink-0 w-[300px] bg-[#1a1a1a]'>
                            <div
                                className='absolute bg-brand w-[3px] h-10 left-0 rounded-full pointer-events-none'
                                style={{
                                    top,
                                    height,
                                    opacity: top === '0' ? 0 : 1,
                                    transition:
                                        'linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms',
                                }}
                            />
                            <div
                                className='absolute bg-zinc-900 w-12 h-10 blur-2xl left-0 rounded-full pointer-events-none'
                                style={{
                                    top,
                                    opacity: top === '0' ? 0 : 0.5,
                                    transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                }}
                            />
                            <div className='flex flex-row items-center justify-between h-8'>
                                <NavLink to={'/'} className='flex shrink-0 h-8 w-fit'>
                                    <Logo uniqueId='server-desktop-sidebar' />
                                </NavLink>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className='w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-[#ffffff11] p-2 select-none cursor-pointer'>
                                            <svg
                                                xmlns='http://www.w3.org/2000/svg'
                                                width='16'
                                                height='15'
                                                fill='currentColor'
                                                viewBox='0 0 16 15'
                                                className='flex shrink-0 h-full w-full'
                                            >
                                                <path d='M8.9375 7.3775C8.9375 7.56341 8.88252 7.74515 8.7795 7.89974C8.67649 8.05432 8.53007 8.1748 8.35877 8.24595C8.18746 8.31709 7.99896 8.33571 7.8171 8.29944C7.63525 8.26317 7.4682 8.17364 7.33709 8.04218C7.20598 7.91072 7.11669 7.74323 7.08051 7.56088C7.04434 7.37854 7.06291 7.18954 7.13386 7.01778C7.20482 6.84601 7.32498 6.69921 7.47915 6.59592C7.63332 6.49263 7.81458 6.4375 8 6.4375C8.24864 6.4375 8.4871 6.53654 8.66291 6.71282C8.83873 6.8891 8.9375 7.1282 8.9375 7.3775ZM1.625 6.4375C1.43958 6.4375 1.25832 6.49263 1.10415 6.59592C0.949982 6.69921 0.829821 6.84601 0.758863 7.01778C0.687906 7.18954 0.669341 7.37854 0.705514 7.56088C0.741688 7.74323 0.830976 7.91072 0.962088 8.04218C1.0932 8.17364 1.26025 8.26317 1.4421 8.29944C1.62396 8.33571 1.81246 8.31709 1.98377 8.24595C2.15507 8.1748 2.30149 8.05432 2.4045 7.89974C2.50752 7.74515 2.5625 7.56341 2.5625 7.3775C2.5625 7.1282 2.46373 6.8891 2.28791 6.71282C2.1121 6.53654 1.87364 6.4375 1.625 6.4375ZM14.375 6.4375C14.1896 6.4375 14.0083 6.49263 13.8542 6.59592C13.7 6.69921 13.5798 6.84601 13.5089 7.01778C13.4379 7.18954 13.4193 7.37854 13.4555 7.56088C13.4917 7.74323 13.581 7.91072 13.7121 8.04218C13.8432 8.17364 14.0102 8.26317 14.1921 8.29944C14.374 8.33571 14.5625 8.31709 14.7338 8.24595C14.9051 8.1748 15.0515 8.05432 15.1545 7.89974C15.2575 7.74515 15.3125 7.56341 15.3125 7.3775C15.3125 7.1282 15.2137 6.8891 15.0379 6.71282C14.8621 6.53654 14.6236 6.4375 14.375 6.4375Z' />
                                            </svg>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className='z-99999 select-none relative' sideOffset={8}>
                                        {rootAdmin && (
                                            <DropdownMenuItem onSelect={onSelectManageServer}>
                                                Manage Server
                                                <span className='ml-2 z-10 rounded-full bg-brand px-2 py-1 text-xs select-none'>
                                                    Staff
                                                </span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={onTriggerLogout}>Log Out</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div aria-hidden className='mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-6'></div>
                            <ul data-pyro-subnav-routes-wrapper='' className='pyro-subnav-routes-wrapper'>
                                {/* lord forgive me for hardcoding this */}
                                <NavLink
                                    className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                    ref={NavigationHome}
                                    to={`/server/${id}`}
                                    end
                                >
                                    <HugeIconsHome fill='currentColor' />
                                    <p>Home</p>
                                </NavLink>
                                <>
                                    <Can action={'file.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationFiles}
                                            to={`/server/${id}/files`}
                                        >
                                            <HugeIconsFolder fill='currentColor' />
                                            <p>Files</p>
                                        </NavLink>
                                    </Can>
                                    <DatabasesSidebarItem id={id} ref={NavigationDatabases} onClick={() => {}} />
                                    <BackupsSidebarItem id={id} ref={NavigationBackups} onClick={() => {}} />
                                    <NetworkingSidebarItem id={id} ref={NavigationNetworking} onClick={() => {}} />
                                    <Can action={'user.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationUsers}
                                            to={`/server/${id}/users`}
                                            end
                                        >
                                            <HugeIconsPeople fill='currentColor' />
                                            <p>Users</p>
                                        </NavLink>
                                    </Can>
                                    <Can
                                        action={[
                                            'startup.read',
                                            'startup.update',
                                            'startup.command',
                                            'startup.docker-image',
                                        ]}
                                        matchAny
                                    >
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationStartup}
                                            to={`/server/${id}/startup`}
                                            end
                                        >
                                            <HugeIconsConsole fill='currentColor' />
                                            <p>Startup</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'schedule.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationSchedules}
                                            to={`/server/${id}/schedules`}
                                        >
                                            <HugeIconsClock fill='currentColor' />
                                            <p>Schedules</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={['settings.*', 'file.sftp']} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationSettings}
                                            to={`/server/${id}/settings`}
                                            end
                                        >
                                            <HugeIconsDashboardSettings fill='currentColor' />
                                            <p>Settings</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={['activity.*', 'activity.read']} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationActivity}
                                            to={`/server/${id}/activity`}
                                            end
                                        >
                                            <HugeIconsPencil fill='currentColor' />
                                            <p>Activity</p>
                                        </NavLink>
                                    </Can>
                                    {/* TODO: finish modrinth support *\}
                    {/* <Can action={['modrinth.*', 'modrinth.download']} matchAny>
                        <NavLink
                            className='flex flex-row items-center sm:hidden md:show'
                            ref={NavigationMod}
                            to={`/server/${id}/mods`}
                            end
                        >
                            <ModrinthLogo />
                            <p>Mods/Plugins</p>
                        </NavLink>
                    </Can> */}
                                </>
                                <Can action={'startup.software'}>
                                    <NavLink
                                        className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                        ref={NavigationShell}
                                        to={`/server/${id}/shell`}
                                        end
                                    >
                                        <HugeIconsController fill='currentColor' />
                                        <p>Software</p>
                                    </NavLink>
                                </Can>
                            </ul>
                        </MainSidebar>

                        <MainWrapper className='w-full'>
                            <CommandMenu />
                            <InstallListener />
                            <TransferListener />
                            <WebsocketHandler />
                            <main
                                data-pyro-main=''
                                data-pyro-transitionrouter=''
                                className='relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]'
                            >
                                {inConflictState &&
                                (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                                    <ConflictStateRenderer />
                                ) : (
                                    <ErrorBoundary>
                                        <Routes location={location}>
                                            {routes.server.map(({ route, permission, component: Component }) => (
                                                <Route
                                                    key={route}
                                                    path={route}
                                                    element={
                                                        <PermissionRoute permission={permission}>
                                                            <Suspense fallback={null}>
                                                                <Component />
                                                            </Suspense>
                                                        </PermissionRoute>
                                                    }
                                                />
                                            ))}

                                            <Route path='*' element={<NotFound />} />
                                        </Routes>
                                    </ErrorBoundary>
                                )}
                            </main>
                        </MainWrapper>
                    </div>
                </>
            )}
        </Fragment>
    );
};

export default ServerRouter;
