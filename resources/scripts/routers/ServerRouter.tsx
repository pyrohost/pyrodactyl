import { Toaster } from 'sonner';
import TransferListener from '@/components/server/TransferListener';
import { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import { useLocation } from 'react-router';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import Logo from '@/components/elements/PyroLogo';
import HugeIconsFolder from '@/components/elements/hugeicons/Folder';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsConnections from '@/components/elements/hugeicons/Connections';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import CommandMenu from '@/components/elements/commandk/CmdK';

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <Fragment key={'server-router'}>
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <></>
                )
            ) : (
                <>
                    <Toaster
                        theme='dark'
                        toastOptions={{
                            unstyled: true,
                            classNames: {
                                toast: 'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
                            },
                        }}
                    />
                    <SubNavigation>
                        <div className='flex flex-row items-center justify-between h-8'>
                            <Link to={'/'} className='flex shrink-0 h-full w-fit'>
                                <Logo />
                            </Link>
                            <div className='flex shrink-0 h-6 w-6 fill-white'>
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
                            </div>
                        </div>
                        <div className='mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-6'></div>
                        <div className='pyro-subnav-routes-wrapper'>
                            {/* lord forgive me for hardcoding this */}
                            <NavLink className='flex flex-row items-center' to={to('/', true)} exact>
                                <HugeIconsHome fill='currentColor' />
                                <p>Home</p>
                            </NavLink>
                            <Can action={'file.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={to('/files', true)} exact>
                                    <HugeIconsFolder fill='currentColor' />
                                    <p>Files</p>
                                </NavLink>
                            </Can>
                            <Can action={'database.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={to('/databases', true)} exact>
                                    <HugeIconsDatabase fill='currentColor' />
                                    <p>Databases</p>
                                </NavLink>
                            </Can>
                            <Can action={'backup.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={to('/backups', true)} exact>
                                    <HugeIconsCloudUp fill='currentColor' />
                                    <p>Backups</p>
                                </NavLink>
                            </Can>
                            <Can action={'allocation.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={to('/network', true)} exact>
                                    <HugeIconsConnections fill='currentColor' />
                                    <p>Networking</p>
                                </NavLink>
                            </Can>
                            <Can action={['settings.*', 'file.sftp']} matchAny>
                                <NavLink className='flex flex-row items-center' to={to('/settings', true)} exact>
                                    <HugeIconsDashboardSettings fill='currentColor' />
                                    <p>Settings</p>
                                </NavLink>
                            </Can>
                            {rootAdmin && (
                                // eslint-disable-next-line react/jsx-no-target-blank
                                <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                    <div className='ml-1'>Manage Server </div>
                                    <span className='z-10 rounded-full bg-brand px-2 py-1 text-xs text-white'>
                                        Staff
                                    </span>
                                </a>
                            )}
                        </div>
                    </SubNavigation>
                    <CommandMenu />
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </Fragment>
    );
};
