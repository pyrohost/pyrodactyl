import { HeaderProvider } from '@/contexts/HeaderContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import {
    Activity02Icon,
    AiNetworkIcon,
    Cardiogram01Icon,
    ClockIcon,
    CloudUploadIcon,
    ComputerTerminal01Icon,
    ConnectIcon,
    Database02Icon,
    FolderIcon,
    GameControllerIcon,
    Home03Icon,
    NoteIcon,
    ServerStack02Icon,
    Settings02Icon,
    Settings04Icon,
    UserMultiple02Icon,
    WorkflowSquare01Icon,
} from '@hugeicons/core-free-icons';
import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router-dom';

import routes from '@/routers/routes';

import DashboardContainer from '@/components/dashboard/DashboardContainer';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import MainWrapper from '@/components/elements/MainWrapper';
import PermissionRoute from '@/components/elements/PermissionRoute';
import Logo from '@/components/elements/PyroLogo';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import CommandMenu from '@/components/elements/commandk/CmdK';
import AppHeader from '@/components/layout/header/AppHeader';
import Sidebar from '@/components/layout/sidebar/Sidebar';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import InstallListener from '@/components/server/InstallListener';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';

// import PyroLogoMark from '@/components/ui/logos/pyromark';

import { httpErrorToHuman } from '@/api/http';
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

const UnifiedRouter = () => {
    const params = useParams<'id'>();
    const location = useLocation();
    const isServerRoute = location.pathname.startsWith('/server/');

    // extract server ID from pathname for server routes
    const serverIdFromPath = isServerRoute ? location.pathname.split('/')[2] : undefined;
    const serverId = serverIdFromPath;

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');
    const [nests, setNests] = useState<Nest[]>();

    // server-specific state
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverInternalId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);
    const egg_id = ServerContext.useStoreState((state) => state.server.data?.egg);

    // console.log('Current server state:', {
    //     id,
    //     uuid,
    //     serverInternalId,
    //     isServerRoute,
    //     paramId: params.id,
    //     serverIdFromPath,
    // });

    const egg_name =
        nests &&
        nests
            .find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === egg_id))
            ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === egg_id)?.attributes.name;

    // fetch nests data when component mounts
    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };
        fetchData();
    }, []);

    // handle server loading when navigating to server routes
    useEffect(() => {
        if (!isServerRoute) {
            return;
        }

        setError('');

        if (serverId === undefined) {
            return;
        }

        // console.log('Loading server with ID:', serverId);
        getServer(serverId)
            .then(() => {
                // console.log('Server loaded successfully');
            })
            .catch((error) => {
                console.error('Error loading server:', error);
                setError(httpErrorToHuman(error));
            });
    }, [serverId, getServer, isServerRoute]);

    // clear server state when leaving server routes
    useEffect(() => {
        if (!isServerRoute) {
            clearServerState();
        }
    }, [isServerRoute, clearServerState]);

    // nav refs
    const NavigationServers = useRef<HTMLAnchorElement>(null);
    const NavigationSettings = useRef<HTMLAnchorElement>(null);
    const NavigationApi = useRef<HTMLAnchorElement>(null);
    const NavigationSSH = useRef<HTMLAnchorElement>(null);
    const NavigationConsole = useRef(null);
    const NavigationFiles = useRef(null);
    const NavigationDatabases = useRef(null);
    const NavigationBackups = useRef(null);
    const NavigationNetworking = useRef(null);
    const NavigationUsers = useRef(null);
    const NavigationStartup = useRef(null);
    const NavigationSchedules = useRef(null);
    const NavigationServerSettings = useRef(null);
    const NavigationActivity = useRef(null);
    const NavigationShell = useRef(null);

    // generate navigation items based on current route
    const navItems = isServerRoute
        ? id
            ? [
                {
                    to: `/server/${id}`,
                    icon: Cardiogram01Icon,
                    text: 'Console',
                    tabName: 'console',
                    ref: NavigationConsole,
                    end: true,
                },
                ...(egg_name && !egg_name?.includes(blank_egg_prefix)
                    ? [
                        {
                            to: `/server/${id}/files`,
                            icon: FolderIcon,
                            text: 'Files',
                            tabName: 'files',
                            ref: NavigationFiles,
                            end: false,
                            permission: 'file.*',
                        },
                        {
                            to: `/server/${id}/databases`,
                            icon: Database02Icon,
                            text: 'Database',
                            minimizedText: 'Database',
                            tabName: 'databases',
                            ref: NavigationDatabases,
                            end: true,
                            permission: 'database.*',
                        },
                        {
                            to: `/server/${id}/backups`,
                            icon: CloudUploadIcon,
                            text: 'Backups',
                            tabName: 'backups',
                            ref: NavigationBackups,
                            end: true,
                            permission: 'backup.*',
                        },
                        {
                            to: `/server/${id}/network`,
                            icon: ConnectIcon,
                            text: 'Network',
                            minimizedText: 'Network',
                            tabName: 'networking',
                            ref: NavigationNetworking,
                            end: true,
                            permission: 'allocation.*',
                        },
                        {
                            to: `/server/${id}/users`,
                            icon: UserMultiple02Icon,
                            text: 'Users',
                            tabName: 'users',
                            ref: NavigationUsers,
                            end: true,
                            permission: 'user.*',
                        },
                        {
                            to: `/server/${id}/startup`,
                            icon: Settings04Icon,
                            text: 'Startup',
                            tabName: 'startup',
                            ref: NavigationStartup,
                            end: true,
                            permission: ['startup.read', 'startup.update', 'startup.docker-image'],
                        },
                        {
                            to: `/server/${id}/schedules`,
                            icon: ClockIcon,
                            text: 'Schedule',
                            tabName: 'schedules',
                            ref: NavigationSchedules,
                            end: false,
                            permission: 'schedule.*',
                        },
                        {
                            to: `/server/${id}/settings`,
                            icon: Settings02Icon,
                            text: 'Settings',
                            tabName: 'settings',
                            ref: NavigationServerSettings,
                            end: true,
                            permission: ['settings.*', 'file.sftp'],
                        },
                        {
                            to: `/server/${id}/activity`,
                            icon: Activity02Icon,
                            text: 'Activity',
                            tabName: 'activity',
                            ref: NavigationActivity,
                            end: true,
                            permission: ['activity.*', 'activity.read'],
                        },
                    ]
                    : []),
                {
                    to: `/server/${id}/shell`,
                    icon: GameControllerIcon,
                    text: 'Software',
                    tabName: 'shell',
                    ref: NavigationShell,
                    end: true,
                    permission: 'startup.software',
                },
            ]
            : [] // empty navigation when server is loading
        : [
            {
                to: '/',
                icon: ServerStack02Icon,
                text: 'Servers',
                tabName: 'servers',
                ref: NavigationServers,
                end: true,
            },
            {
                to: '/account/api',
                icon: NoteIcon,
                text: 'API Keys',
                minimizedText: 'API',
                tabName: 'api',
                ref: NavigationApi,
                end: true,
            },
            {
                to: '/account/ssh',
                icon: ComputerTerminal01Icon,
                text: 'SSH Keys',
                minimizedText: 'SSH',
                tabName: 'ssh',
                ref: NavigationSSH,
                end: true,
            },
            {
                to: '/account',
                icon: Settings02Icon,
                text: 'Settings',
                tabName: 'settings',
                ref: NavigationSettings,
                end: true,
            },
        ];

    return (
        <SidebarProvider>
            <HeaderProvider>
                <Fragment key={'unified-router'}>
                    <div className='flex flex-col w-full h-full relative'>
                        <AppHeader serverId={isServerRoute ? serverInternalId?.toString() : undefined} />

                        <div className='flex h-full w-full overflow-hidden relative'>
                            <Sidebar navItems={navItems} />

                            {/* server-specific components - only render when we have server data */}
                            {isServerRoute && uuid && id && (
                                <>
                                    <CommandMenu />
                                    <InstallListener />
                                    <TransferListener />
                                    <WebsocketHandler />
                                </>
                            )}

                            <Suspense fallback={null}>
                                <MainWrapper>
                                    {/* server error state */}
                                    {isServerRoute && error && (
                                        <ServerError title='Something went wrong' message={error} />
                                    )}

                                    {/* server loading state */}
                                    {isServerRoute && !error && (!uuid || !id) && (
                                        <div className='flex items-center justify-center h-full opacity-10'>
                                            <div className='p-1 pyro-logo1 '>
                                                <Logo />
                                            </div>
                                        </div>
                                    )}

                                    {/* server conflict state */}
                                    {isServerRoute &&
                                        uuid &&
                                        id &&
                                        inConflictState &&
                                        (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) && (
                                            <ConflictStateRenderer />
                                        )}

                                    {/* normal routing */}
                                    {((isServerRoute &&
                                        uuid &&
                                        id &&
                                        (!inConflictState ||
                                            (rootAdmin && location.pathname.endsWith(`/server/${id}`)))) ||
                                        !isServerRoute) && (
                                            <ErrorBoundary>
                                                <Routes>
                                                    {/* dashboard routes */}
                                                    {!isServerRoute && (
                                                        <>
                                                            <Route path='' element={<DashboardContainer />} />
                                                            {routes.account.map(({ route, component: Component }) => (
                                                                <Route
                                                                    key={route}
                                                                    path={`/account/${route}`.replace('//', '/')}
                                                                    element={<Component />}
                                                                />
                                                            ))}
                                                        </>
                                                    )}{' '}
                                                    {/* server routes */}
                                                    {isServerRoute && uuid && id && (
                                                        <>
                                                            {routes.server.map(
                                                                ({ route, permission, component: Component }) => (
                                                                    <Route
                                                                        key={route}
                                                                        path={
                                                                            route === ''
                                                                                ? `/server/${id}`
                                                                                : `/server/${id}/${route}`
                                                                        }
                                                                        element={
                                                                            <PermissionRoute permission={permission}>
                                                                                <Suspense fallback={null}>
                                                                                    <Component />
                                                                                </Suspense>
                                                                            </PermissionRoute>
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </>
                                                    )}
                                                    <Route path='*' element={<NotFound />} />
                                                </Routes>
                                            </ErrorBoundary>
                                        )}
                                </MainWrapper>
                            </Suspense>
                        </div>
                    </div>
                </Fragment>
            </HeaderProvider>
        </SidebarProvider>
    );
};

export default UnifiedRouter;
