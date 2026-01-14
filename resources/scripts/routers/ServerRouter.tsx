'use client';

import { Ellipsis } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import type { RefObject } from 'react';
import { Fragment, Suspense, createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';

import routes, { type ServerRouteDefinition, getServerNavRoutes } from '@/routers/routes';

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
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import ServerSidebarNavItem from '@/components/server/ServerSidebarNavItem';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import StatBlock from '@/components/server/console/StatBlock';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
import { getSubdomainInfo } from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

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
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.allocations);

    // Mobile menu state
    const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);

    // Scroll tracking for highlight indicator
    const navContainerRef = useRef<HTMLUListElement>(null);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [containerTop, setContainerTop] = useState(0);

    // Get navigation routes from centralized config
    const navRoutes = useMemo(() => getServerNavRoutes(), []);

    // Create refs dynamically for each navigation route
    const navRefs = useMemo(() => {
        const refs: Record<string, RefObject<HTMLAnchorElement | null>> = {};
        navRoutes.forEach((route) => {
            const key = route.path || 'home';
            refs[key] = createRef<HTMLAnchorElement>();
        });
        return refs;
    }, [navRoutes]);

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

    /**
     * Calculate the top position of the highlight indicator based on the current route.
     * Dynamically matches routes using the route config instead of hardcoded paths.
     */
    const calculateTop = (pathname: string): string | number => {
        if (!id) return '0';

        const HighlightOffset = 8;

        // Find matching route for the current pathname
        for (const route of navRoutes) {
            const key = route.path || 'home';
            const ref = navRefs[key];

            if (!ref?.current) continue;

            const basePath = route.path ? `/server/${id}/${route.path}` : `/server/${id}`;

            // Check if exact match (for routes with end: true)
            if (route.end && pathname === basePath) {
                return ref.current.offsetTop + HighlightOffset;
            }

            // Check highlight patterns if defined
            if (route.highlightPatterns) {
                for (const pattern of route.highlightPatterns) {
                    if (pattern.test(pathname)) {
                        return ref.current.offsetTop + HighlightOffset;
                    }
                }
            }

            // Check if pathname starts with base path (for routes without end)
            if (!route.end && pathname.startsWith(basePath)) {
                return ref.current.offsetTop + HighlightOffset;
            }
        }

        return '0';
    };

    const top = calculateTop(location.pathname);

    const [height, setHeight] = useState('40px');

    useEffect(() => {
        setHeight('34px');
        const timeoutId = setTimeout(() => setHeight('40px'), 200);
        return () => clearTimeout(timeoutId);
    }, [top]);

    // Track scroll position of the nav container
    const handleScroll = useCallback((e: React.UIEvent<HTMLUListElement>) => {
        setScrollOffset(e.currentTarget.scrollTop);
        setContainerHeight(e.currentTarget.clientHeight);
    }, []);

    // Measure container dimensions
    const measureContainer = useCallback(() => {
        if (navContainerRef.current) {
            setContainerHeight(navContainerRef.current.clientHeight);
            setContainerTop(navContainerRef.current.offsetTop);
        }
    }, []);

    // Measure container on mount/update and window resize (debounced)
    useEffect(() => {
        measureContainer();

        let resizeTimeout: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(measureContainer, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, [id, uuid, measureContainer]);

    // Adjust top position based on scroll offset
    const adjustedTop = typeof top === 'number' ? top - scrollOffset : top;

    // Check if the highlighted item is within the visible scroll area
    const isHighlightVisible = useMemo(() => {
        if (typeof top !== 'number' || top === 0) return false;
        if (containerHeight === 0) return true; // Not yet measured, assume visible

        const itemHeight = 40; // Height of a nav item
        // top is relative to sidebar, containerTop is where the scrollable area starts
        const itemTopRelativeToContainer = top - containerTop;
        const itemBottomRelativeToContainer = itemTopRelativeToContainer + itemHeight;

        // Check if item is within the visible scroll window
        const visibleTop = scrollOffset;
        const visibleBottom = scrollOffset + containerHeight;

        return itemBottomRelativeToContainer > visibleTop && itemTopRelativeToContainer < visibleBottom;
    }, [top, scrollOffset, containerHeight, containerTop]);

    /**
     * Get the ref for a specific route by its path key.
     */
    const getRefForRoute = (route: ServerRouteDefinition) => {
        const key = route.path || 'home';
        return navRefs[key];
    };

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
                            {/* Highlight */}
                            <div
                                className='absolute bg-brand w-[3px] h-10 left-0 rounded-full pointer-events-none'
                                style={{
                                    top: adjustedTop,
                                    height,
                                    opacity: isHighlightVisible ? 1 : 0,
                                    transition:
                                        'linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms',
                                }}
                            />
                            <div
                                className='absolute bg-zinc-900 w-12 h-10 blur-2xl left-0 rounded-full pointer-events-none'
                                style={{
                                    top: adjustedTop,
                                    opacity: isHighlightVisible ? 0.5 : 0,
                                    transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                }}
                            />
                            <ul
                                ref={navContainerRef}
                                onScroll={handleScroll}
                                data-pyro-subnav-routes-wrapper=''
                                className='pyro-subnav-routes-wrapper flex-grow overflow-y-auto'
                            >
                                {/* Dynamic navigation items from routes config */}
                                {navRoutes.map((route) => (
                                    <ServerSidebarNavItem
                                        key={route.path || 'home'}
                                        ref={getRefForRoute(route)}
                                        route={route}
                                        serverId={id}
                                        onClick={() => {}}
                                    />
                                ))}
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
                                                        <PermissionRoute permission={permission ?? undefined}>
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
