import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, useEffect, useState, useRef } from 'react';
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
import PermissionRoute from '@/components/elements/PermissionRoute';
import Logo from '@/components/elements/PyroLogo';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import CommandMenu from '@/components/elements/commandk/CmdK';
import HugeIconsClock from '@/components/elements/hugeicons/Clock';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsConnections from '@/components/elements/hugeicons/Connections';
import HugeIconsConsole from '@/components/elements/hugeicons/Console';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsFolder from '@/components/elements/hugeicons/Folder';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import HugeIconsPeople from '@/components/elements/hugeicons/People';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';

import { ServerContext } from '@/state/server';

export default () => {
    const params = useParams<'id'>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

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

        // Perfectly center the page highlighter with simple math.
        // Height of navigation links (56) minus highlight height (40) equals 16. 16 devided by 2 is 8.
        const HighlightOffset : number = 8

        if (pathname.endsWith(`/server/${id}`) && ButtonHome != null) return (ButtonHome as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/files`) && ButtonFiles != null) return (ButtonFiles as any).offsetTop+HighlightOffset;
        if (new RegExp(`^/server/${id}/files(/(new|edit).*)?$`).test(pathname) && ButtonFiles != null) return (ButtonFiles as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/databases`) && ButtonDatabases != null) return (ButtonDatabases as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/backups`) && ButtonBackups != null) return (ButtonBackups as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/network`) && ButtonNetworking != null) return (ButtonNetworking as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/users`) && ButtonUsers != null) return (ButtonUsers as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/startup`) && ButtonStartup != null) return (ButtonStartup as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/schedules`) && ButtonSchedules != null) return (ButtonSchedules as any).offsetTop+HighlightOffset;
        if (new RegExp(`^/server/${id}/schedules/\\d+$`).test(pathname) && ButtonSchedules != null) return (ButtonSchedules as any).offsetTop+HighlightOffset;
        if (pathname.endsWith(`/server/${id}/settings`) && ButtonSettings != null) return (ButtonSettings as any).offsetTop+HighlightOffset;
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
                    <MainSidebar className='hidden lg:flex'>
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
                            className='absolute bg-brand w-12 h-10 blur-2xl left-0 rounded-full pointer-events-none'
                            style={{
                                top,
                                opacity: top === '0' ? 0 : 0.5,
                                transition:
                                    'top linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms',
                            }}
                        />
                        <div className='flex flex-row items-center justify-between h-8'>
                            <NavLink to={'/'} className='flex shrink-0 h-full w-fit'>
                                <Logo />
                            </NavLink>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className='w-8 h-8 flex items-center justify-center rounded-md text-white hover:bg-[#ffffff11] p-1'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='32'
                                            height='32'
                                            fill='currentColor'
                                            viewBox='0 0 256 256'
                                            className='flex shrink-0 h-full w-full'
                                        >
                                            {/* @ts-ignore */}
                                            <path d='M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z'></path>
                                        </svg>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-[99999]' sideOffset={8}>
                                    {rootAdmin && (
                                        <DropdownMenuItem onSelect={onSelectManageServer}>
                                            Manage Server
                                            <span className='ml-2 z-10 rounded-full bg-brand px-2 py-1 text-xs text-white'>
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
                            <NavLink className='flex flex-row items-center' ref={NavigationHome} to={`/server/${id}`} end>
                                <HugeIconsHome fill='currentColor' />
                                <p>Home</p>
                            </NavLink>
                            <Can action={'file.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationFiles} to={`/server/${id}/files`}>
                                    <HugeIconsFolder fill='currentColor' />
                                    <p>Files</p>
                                </NavLink>
                            </Can>
                            <Can action={'database.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationDatabases} to={`/server/${id}/databases`} end>
                                    <HugeIconsDatabase fill='currentColor' />
                                    <p>Databases</p>
                                </NavLink>
                            </Can>
                            <Can action={'backup.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationBackups} to={`/server/${id}/backups`} end>
                                    <HugeIconsCloudUp fill='currentColor' />
                                    <p>Backups</p>
                                </NavLink>
                            </Can>
                            <Can action={'allocation.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationNetworking} to={`/server/${id}/network`} end>
                                    <HugeIconsConnections fill='currentColor' />
                                    <p>Networking</p>
                                </NavLink>
                            </Can>
                            <Can action={'user.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationUsers} to={`/server/${id}/users`} end>
                                    <HugeIconsPeople fill='currentColor' />
                                    <p>Users</p>
                                </NavLink>
                            </Can>
                            <Can action={'startup.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationStartup} to={`/server/${id}/startup`} end>
                                    <HugeIconsConsole fill='currentColor' />
                                    <p>Startup</p>
                                </NavLink>
                            </Can>
                            <Can action={'schedule.*'} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationSchedules} to={`/server/${id}/schedules`}>
                                    <HugeIconsClock fill='currentColor' />
                                    <p>Schedules</p>
                                </NavLink>
                            </Can>
                            <Can action={['settings.*', 'file.sftp']} matchAny>
                                <NavLink className='flex flex-row items-center' ref={NavigationSettings} to={`/server/${id}/settings`} end>
                                    <HugeIconsDashboardSettings fill='currentColor' />
                                    <p>Settings</p>
                                </NavLink>
                            </Can>
                            {/* {rootAdmin && (
                                <a href={`/admin/servers/view/${serverId}`} target={'_blank'} rel='noreferrer'>
                                    <div className='ml-1'>Manage Server </div>
                                    <span className='z-10 rounded-full bg-brand px-2 py-1 text-xs text-white'>
                                        Staff
                                    </span>
                                </a>
                            )} */}
                        </ul>
                    </MainSidebar>
                    <CommandMenu />
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    <MainWrapper>
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
                </>
            )}
        </Fragment>
    );
};
