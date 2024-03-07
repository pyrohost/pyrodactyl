import { Toaster } from 'sonner';
import TransferListener from '@/components/server/TransferListener';
import { Fragment, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import { useLocation } from 'react-router';
import MainSidebar from '@/components/elements/MainSidebar';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenuNew';
import http from '@/api/http';
import MainWrapper from '@/components/elements/MainWrapper';

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

    useEffect(
        () => () => {
            clearServerState();
        },
        []
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

    // For now this doesn't account for subusers that may not
    // have all permissions for a server, so the locations are hardcoded.
    // TODO: in the future, we will want to just map the routes and get their ref,
    // and then use that to calculate the top position.
    const calculateTop = (pathname: string) => {
        if (!id) return '0';

        if (pathname.endsWith(`/server/${id}`)) return '7.5rem';
        if (pathname.endsWith(`/server/${id}/files`)) return '11rem';
        if (pathname.endsWith(`/server/${id}/databases`)) return '14.5rem';
        if (pathname.endsWith(`/server/${id}/backups`)) return '18rem';
        if (pathname.endsWith(`/server/${id}/network`)) return '21.5rem';
        if (pathname.endsWith(`/server/${id}/settings`)) return '25rem';
        return '0';
    };

    const top = calculateTop(location.pathname);

    return (
        <Fragment key={'server-router'}>
            {!uuid || !id ? (
                error ? (
                    <ServerError title='Something went wrong' message={error} />
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
                    <MainSidebar>
                        <div
                            className='absolute bg-brand w-[3px] h-10 left-0 rounded-full pointer-events-none'
                            style={{
                                top,
                                opacity: top === '0' ? 0 : 1,
                                transition: 'top 95ms',
                                transitionTimingFunction: 'ease-in-out',
                            }}
                        />
                        <div
                            className='absolute bg-brand w-12 h-10 blur-2xl left-0 rounded-full pointer-events-none'
                            style={{
                                top,
                                opacity: top === '0' ? 0 : 0.5,
                                transition: 'top 95ms',
                                transitionTimingFunction: 'ease-in-out',
                            }}
                        />
                        <div className='flex flex-row items-center justify-between h-8'>
                            <NavLink to={'/'} className='flex shrink-0 h-full w-fit'>
                                <Logo />
                            </NavLink>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className='w-8 h-8 flex items-center justify-center rounded-md text-white'>
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
                                    <DropdownMenuItem onClick={onTriggerLogout}>Log Out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className='mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-6'></div>
                        <div className='pyro-subnav-routes-wrapper'>
                            {/* lord forgive me for hardcoding this */}
                            <NavLink className='flex flex-row items-center' to={`/server/${id}`} end>
                                <HugeIconsHome fill='currentColor' />
                                <p>Home</p>
                            </NavLink>
                            <Can action={'file.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={`/server/${id}/files`} end>
                                    <HugeIconsFolder fill='currentColor' />
                                    <p>Files</p>
                                </NavLink>
                            </Can>
                            <Can action={'database.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={`/server/${id}/databases`} end>
                                    <HugeIconsDatabase fill='currentColor' />
                                    <p>Databases</p>
                                </NavLink>
                            </Can>
                            <Can action={'backup.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={`/server/${id}/backups`} end>
                                    <HugeIconsCloudUp fill='currentColor' />
                                    <p>Backups</p>
                                </NavLink>
                            </Can>
                            <Can action={'allocation.*'} matchAny>
                                <NavLink className='flex flex-row items-center' to={`/server/${id}/network`} end>
                                    <HugeIconsConnections fill='currentColor' />
                                    <p>Networking</p>
                                </NavLink>
                            </Can>
                            <Can action={['settings.*', 'file.sftp']} matchAny>
                                <NavLink className='flex flex-row items-center' to={`/server/${id}/settings`} end>
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
