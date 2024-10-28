import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
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
import HugeIconsController from '@/components/elements/hugeicons/Controller';
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
import getNests from '@/api/nests/getNests';

import { ServerContext } from '@/state/server';

const blank_egg_prefix = '@';

interface Egg {
    object: string;
    attributes: {
        uuid: string;
        name: string;
        description: string;
    };
}

interface Nest {
    object: string;
    attributes: {
        id: number;
        name: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
}

export default () => {
    const params = useParams<'id'>();
    const location = useLocation();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);
    const egg_id = ServerContext.useStoreState((state) => state.server.data?.egg);
    const [nests, setNests] = useState<Nest[]>();

    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible);
    };

    const egg_name =
        nests &&
        nests
            .find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === egg_id))
            ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === egg_id)?.attributes.name;

    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };

        fetchData();
    }, []);

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
                    <button
                        id='sidebarToggle'
                        className={`lg:hidden fixed top-4 z-50 bg-transparent p-2 rounded-md text-white ${
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

                    <MainSidebar className={`${isSidebarVisible ? '' : 'hidden'} lg:flex`}>
                        <div
                            className='absolute bg-white w-[3px] h-10 left-0 rounded-full pointer-events-none'
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
                                    <button className='w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-[#ffffff11] p-2'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='16'
                                            height='15'
                                            fill='currentColor'
                                            viewBox='0 0 16 15'
                                            className='flex shrink-0 h-full w-full'
                                        >
                                            {/* @ts-ignore */}
                                            <path d='M8.9375 7.3775C8.9375 7.56341 8.88252 7.74515 8.7795 7.89974C8.67649 8.05432 8.53007 8.1748 8.35877 8.24595C8.18746 8.31709 7.99896 8.33571 7.8171 8.29944C7.63525 8.26317 7.4682 8.17364 7.33709 8.04218C7.20598 7.91072 7.11669 7.74323 7.08051 7.56088C7.04434 7.37854 7.06291 7.18954 7.13386 7.01778C7.20482 6.84601 7.32498 6.69921 7.47915 6.59592C7.63332 6.49263 7.81458 6.4375 8 6.4375C8.24864 6.4375 8.4871 6.53654 8.66291 6.71282C8.83873 6.8891 8.9375 7.1282 8.9375 7.3775ZM1.625 6.4375C1.43958 6.4375 1.25832 6.49263 1.10415 6.59592C0.949982 6.69921 0.829821 6.84601 0.758863 7.01778C0.687906 7.18954 0.669341 7.37854 0.705514 7.56088C0.741688 7.74323 0.830976 7.91072 0.962088 8.04218C1.0932 8.17364 1.26025 8.26317 1.4421 8.29944C1.62396 8.33571 1.81246 8.31709 1.98377 8.24595C2.15507 8.1748 2.30149 8.05432 2.4045 7.89974C2.50752 7.74515 2.5625 7.56341 2.5625 7.3775C2.5625 7.1282 2.46373 6.8891 2.28791 6.71282C2.1121 6.53654 1.87364 6.4375 1.625 6.4375ZM14.375 6.4375C14.1896 6.4375 14.0083 6.49263 13.8542 6.59592C13.7 6.69921 13.5798 6.84601 13.5089 7.01778C13.4379 7.18954 13.4193 7.37854 13.4555 7.56088C13.4917 7.74323 13.581 7.91072 13.7121 8.04218C13.8432 8.17364 14.0102 8.26317 14.1921 8.29944C14.374 8.33571 14.5625 8.31709 14.7338 8.24595C14.9051 8.1748 15.0515 8.05432 15.1545 7.89974C15.2575 7.74515 15.3125 7.56341 15.3125 7.3775C15.3125 7.1282 15.2137 6.8891 15.0379 6.71282C14.8621 6.53654 14.6236 6.4375 14.375 6.4375Z' />
                                        </svg>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-[99999]' sideOffset={8}>
                                    {rootAdmin && (
                                        <DropdownMenuItem onSelect={onSelectManageServer}>
                                            Manage Server
                                            <span className='ml-2 z-10 rounded-full bg-white px-2 py-1 text-xs text-black'>
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
                                className='flex flex-row items-center'
                                ref={NavigationHome}
                                to={`/server/${id}`}
                                end
                            >
                                <HugeIconsHome fill='currentColor' />
                                <p>Home</p>
                            </NavLink>
                            {egg_name && !egg_name?.includes(blank_egg_prefix) && (
                                <>
                                    <Can action={'file.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationFiles}
                                            to={`/server/${id}/files`}
                                        >
                                            <HugeIconsFolder fill='currentColor' />
                                            <p>Files</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'database.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationDatabases}
                                            to={`/server/${id}/databases`}
                                            end
                                        >
                                            <HugeIconsDatabase fill='currentColor' />
                                            <p>Databases</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'backup.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationBackups}
                                            to={`/server/${id}/backups`}
                                            end
                                        >
                                            <HugeIconsCloudUp fill='currentColor' />
                                            <p>Backups</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'allocation.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationNetworking}
                                            to={`/server/${id}/network`}
                                            end
                                        >
                                            <HugeIconsConnections fill='currentColor' />
                                            <p>Networking</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={'user.*'} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationUsers}
                                            to={`/server/${id}/users`}
                                            end
                                        >
                                            <HugeIconsPeople fill='currentColor' />
                                            <p>Users</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={['startup.read', 'startup.update', 'startup.docker-image']} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
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
                                            className='flex flex-row items-center'
                                            ref={NavigationSchedules}
                                            to={`/server/${id}/schedules`}
                                        >
                                            <HugeIconsClock fill='currentColor' />
                                            <p>Schedules</p>
                                        </NavLink>
                                    </Can>
                                    <Can action={['settings.*', 'file.sftp']} matchAny>
                                        <NavLink
                                            className='flex flex-row items-center'
                                            ref={NavigationSettings}
                                            to={`/server/${id}/settings`}
                                            end
                                        >
                                            <HugeIconsDashboardSettings fill='currentColor' />
                                            <p>Settings</p>
                                        </NavLink>
                                    </Can>
                                </>
                            )}
                            <Can action={'startup.software'}>
                                <NavLink
                                    className='flex flex-row items-center'
                                    ref={NavigationShell}
                                    to={`/server/${id}/shell`}
                                    end
                                >
                                    <HugeIconsController fill='currentColor' />
                                    <p>Software</p>
                                </NavLink>
                            </Can>
                            {/* {rootAdmin && (
                                <a href={`/admin/servers/view/${serverId}`} target={'_blank'} rel='noreferrer'>
                                    <div className='ml-1'>Manage Server </div>
                                    <span className='z-10 rounded-full bg-zinc-600 px-2 py-1 text-xs text-white'>
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