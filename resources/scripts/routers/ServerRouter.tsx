'use client';

import {
    Box,
    BranchesDown,
    ClockArrowRotateLeft,
    CloudArrowUpIn,
    Database,
    Ellipsis,
    FolderOpen,
    Gear,
    House,
    PencilToLine,
    Persons,
    Terminal,
} from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
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
import ModrinthLogo from '@/components/elements/ModrinthLogo';
import PermissionRoute from '@/components/elements/PermissionRoute';
import Logo from '@/components/elements/PyroLogo';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import CommandMenu from '@/components/elements/commandk/CmdK';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import StatBlock from '@/components/server/console/StatBlock';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
import { SubdomainInfo, getSubdomainInfo } from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

// Sidebar item components that check both permissions and feature limits
const DatabasesSidebarItem = React.forwardRef<HTMLAnchorElement, { id: string; onClick: () => void }>(
    ({ id, onClick }, ref) => {
        const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);

        // Hide if databases are disabled (limit is 0)
        if (databaseLimit === 0) return null;

        return (
            <Can action={'database.*'} matchAny>
                <NavLink
                    className='flex flex-row items-center transition-colors duration-200 hover:bg-white/10 rounded-md'
                    ref={ref}
                    to={`/server/${id}/databases`}
                    onClick={onClick}
                    end
                >
                    <Database width={22} height={22} fill='currentColor' />
                    <p>Databases</p>
                </NavLink>
            </Can>
        );
    },
);
DatabasesSidebarItem.displayName = 'DatabasesSidebarItem';

const BackupsSidebarItem = React.forwardRef<HTMLAnchorElement, { id: string; onClick: () => void }>(
    ({ id, onClick }, ref) => {
        const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);

        // Hide if backups are disabled (limit is 0)
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
                    <CloudArrowUpIn width={22} height={22} fill='currentColor' />
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
                    <BranchesDown width={22} height={22} fill='currentColor' />
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
    const serverName = ServerContext.useStoreState((state) => state.server.data?.name);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);
    const egg_id = ServerContext.useStoreState((state) => state.server.data?.egg);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.allocations);

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
                        <MainSidebar className='hidden lg:flex lg:relative lg:shrink-0 w-[300px] bg-[#1a1a1a] flex flex-col h-screen'>
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
                                            <Ellipsis fill='currentColor' width={26} height={22} />
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
                            <ul
                                data-pyro-subnav-routes-wrapper=''
                                className='pyro-subnav-routes-wrapper flex-grow overflow-y-auto'
                            >
                                {/* lord forgive me for hardcoding this */}
                                <NavLink
                                    className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                    ref={NavigationHome}
                                    to={`/server/${id}`}
                                    end
                                >
                                    <House width={22} height={22} fill='currentColor' />
                                    <p>Home</p>
                                </NavLink>
                                <>
                                    <Can action={'file.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationFiles}
                                            to={`/server/${id}/files`}
                                        >
                                            <FolderOpen width={22} height={22} fill='currentColor' />
                                            <p>Files</p>
                                        </NavLink>
                                    </Can>
                                    <DatabasesSidebarItem id={id} ref={NavigationDatabases} onClick={() => { }} />
                                    <BackupsSidebarItem id={id} ref={NavigationBackups} onClick={() => { }} />
                                    <NetworkingSidebarItem id={id} ref={NavigationNetworking} onClick={() => { }} />
                                    <Can action={'user.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationUsers}
                                            to={`/server/${id}/users`}
                                            end
                                        >
                                            <Persons width={22} height={22} fill='currentColor' />
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
                                            <Terminal width={22} height={22} fill='currentColor' />
                                            <p>Startup</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'schedule.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                            ref={NavigationSchedules}
                                            to={`/server/${id}/schedules`}
                                        >
                                            <ClockArrowRotateLeft width={22} height={22} fill='currentColor' />
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
                                            <Gear width={22} height={22} fill='currentColor' />
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
                                            <PencilToLine width={22} height={22} fill='currentColor' />
                                            <p>Activity</p>
                                        </NavLink>
                                    </Can>
                                    {/* {/* TODO: finish modrinth support *\} */}
                                    {/* <Can action={['modrinth.*', 'modrinth.download']} matchAny> */}
                                    {/*     <NavLink */}
                                    {/*         className='flex flex-row items-center sm:hidden md:show' */}
                                    {/*         ref={NavigationMod} */}
                                    {/*         to={`/server/${id}/mods`} */}
                                    {/*         end */}
                                    {/*     > */}
                                    {/*         <ModrinthLogo /> */}
                                    {/*         <p>Mods/Plugins</p> */}
                                    {/*     </NavLink> */}
                                    {/* </Can> */}
                                </>
                                <Can action={'startup.software'}>
                                    <NavLink
                                        className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
                                        ref={NavigationShell}
                                        to={`/server/${id}/shell`}
                                        end
                                    >
                                        <Box width={22} height={22} fill='currentColor' />
                                        <p>Software</p>
                                    </NavLink>
                                </Can>
                            </ul>
                            <div className='shrink-0'>
                                <div aria-hidden className='mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-full'></div>
                                <StatBlock
                                    title='server'
                                    className='p-4 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-xs rounded-xl text-center hover:cursor-default'
                                >
                                    {serverName}
                                </StatBlock>
                            </div>
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
