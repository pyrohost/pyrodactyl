import { Link, NavLink, Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import routes from '@/routers/routes';
import Logo from '@/components/elements/PyroLogo';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import http from '@/api/http';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import DropdownMenu, { DropdownButtonRow } from '@/components/elements/DropdownMenu';
import { Suspense } from 'react';

export default () => {
    const location = useLocation();
    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <>
            {/* <NavigationBar /> */}
            {/* {location.pathname.startsWith('/account') && ( */}
            <SubNavigation>
                <div className='relative flex flex-row items-center justify-between h-8'>
                    <Link to={'/'} className='flex shrink-0 h-full w-fit'>
                        <Logo />
                    </Link>
                    <DropdownMenu
                        renderToggle={(onClick) => (
                            <button onClick={onClick} className='absolute right-0 flex shrink-0 h-6 w-6 fill-white'>
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
                        )}
                    >
                        <DropdownButtonRow onClick={onTriggerLogout}>
                            <p>Sign Out</p>
                        </DropdownButtonRow>
                    </DropdownMenu>
                </div>
                <div className='mt-8 mb-4 bg-[#ffffff33] min-h-[1px] w-6'></div>
                <div className='pyro-subnav-routes-wrapper'>
                    <NavLink to={'/'} exact className='flex flex-row items-center'>
                        <HugeIconsHome fill='currentColor' />
                        <p>Your Servers</p>
                    </NavLink>
                    <NavLink to={'/account'} exact className='flex flex-row items-center'>
                        <HugeIconsDashboardSettings fill='currentColor' />
                        <p>Your Settings</p>
                    </NavLink>
                </div>
            </SubNavigation>
            {/* )} */}
            <TransitionRouter>
                <Suspense fallback={null}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </Suspense>
            </TransitionRouter>
        </>
    );
};
