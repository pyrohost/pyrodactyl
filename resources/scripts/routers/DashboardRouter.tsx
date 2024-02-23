import React from 'react';
import { Link, NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import Logo from '@/components/elements/PyroLogo';

export default () => {
    const location = useLocation();

    return (
        <>
            {/* <NavigationBar /> */}
            {/* {location.pathname.startsWith('/account') && ( */}
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
                <div className='mt-6 mb-4 bg-[#ffffff33] h-[1px] w-8'></div>
                <div className='pyro-subnav-routes-wrapper'>
                    {/* Hidden for now until I add the dropdown component for these account routes. */}
                    {/* {routes.account
                            .filter((route) => !!route.name)
                            .map(({ path, name, exact = false }) => (
                                <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                    {name}
                                </NavLink>
                            ))} */}
                </div>
            </SubNavigation>
            {/* )} */}
            <TransitionRouter>
                <React.Suspense fallback={null}>
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
                </React.Suspense>
            </TransitionRouter>
        </>
    );
};
