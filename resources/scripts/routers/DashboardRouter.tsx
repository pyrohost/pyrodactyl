import { NavLink, Route, Routes } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import MainSidebar from '@/components/elements/MainSidebar';
import routes from '@/routers/routes';
import Logo from '@/components/elements/PyroLogo';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import http from '@/api/http';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import { Suspense } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenuNew';
import { useLocation } from 'react-router';
import MainWrapper from '@/components/elements/MainWrapper';

export default () => {
    const location = useLocation();

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const calculateTop = (pathname: string) => {
        if (pathname.endsWith(`/`)) return '7.5rem';
        if (pathname.endsWith(`/account`)) return '11rem';
        return '0';
    };

    const top = calculateTop(location.pathname);

    return (
        <>
            <MainSidebar className='hidden lg:flex'>
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
                <div className='relative flex flex-row items-center justify-between h-8'>
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
                    <NavLink to={'/'} end className='flex flex-row items-center'>
                        <HugeIconsHome fill='currentColor' />
                        <p>Servers</p>
                    </NavLink>
                    <NavLink to={'/account'} end className='flex flex-row items-center'>
                        <HugeIconsDashboardSettings fill='currentColor' />
                        <p>Settings</p>
                    </NavLink>
                </div>
            </MainSidebar>

            <Suspense fallback={null}>
                <MainWrapper>
                    <main
                        data-pyro-main=''
                        data-pyro-transitionrouter=''
                        className='relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]'
                    >
                        <Routes>
                            <Route path='' element={<DashboardContainer />} />

                            {routes.account.map(({ route, component: Component }) => (
                                <Route
                                    key={route}
                                    path={`/account/${route}`.replace('//', '/')}
                                    element={<Component />}
                                />
                            ))}

                            <Route path='*' element={<NotFound />} />
                        </Routes>
                    </main>
                </MainWrapper>
            </Suspense>
        </>
    );
};
