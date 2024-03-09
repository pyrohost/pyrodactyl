import { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenuNew';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const [dashboardDisplayOption, setDashboardDisplayOption] = usePersistedState(
        `${uuid}:dashboard_display_option`,
        'list',
    );

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined }),
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <Tabs
                defaultValue={dashboardDisplayOption}
                onValueChange={(value) => {
                    setDashboardDisplayOption(value);
                }}
                className='w-full'
            >
                <div className={'flex flex-col md:flex-row justify-between items-center mb-8 gap-8 mt-8 md:mt-0'}>
                    <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Your Servers</h1>
                    <div className='flex gap-4'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className='flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-md bg-[#ffffff11]'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='21'
                                        viewBox='0 0 20 21'
                                        fill='none'
                                    >
                                        <path
                                            d='M17 3.25C17 3.05109 16.921 2.86032 16.7803 2.71967C16.6397 2.57902 16.4489 2.5 16.25 2.5C16.0511 2.5 15.8603 2.57902 15.7197 2.71967C15.579 2.86032 15.5 3.05109 15.5 3.25V8.75C15.5 8.94891 15.579 9.13968 15.7197 9.28033C15.8603 9.42098 16.0511 9.5 16.25 9.5C16.4489 9.5 16.6397 9.42098 16.7803 9.28033C16.921 9.13968 17 8.94891 17 8.75V3.25ZM17 16.25C17 16.0511 16.921 15.8603 16.7803 15.7197C16.6397 15.579 16.4489 15.5 16.25 15.5C16.0511 15.5 15.8603 15.579 15.7197 15.7197C15.579 15.8603 15.5 16.0511 15.5 16.25V17.75C15.5 17.9489 15.579 18.1397 15.7197 18.2803C15.8603 18.421 16.0511 18.5 16.25 18.5C16.4489 18.5 16.6397 18.421 16.7803 18.2803C16.921 18.1397 17 17.9489 17 17.75V16.25ZM3.75 15.5C3.94891 15.5 4.13968 15.579 4.28033 15.7197C4.42098 15.8603 4.5 16.0511 4.5 16.25V17.75C4.5 17.9489 4.42098 18.1397 4.28033 18.2803C4.13968 18.421 3.94891 18.5 3.75 18.5C3.55109 18.5 3.36032 18.421 3.21967 18.2803C3.07902 18.1397 3 17.9489 3 17.75V16.25C3 16.0511 3.07902 15.8603 3.21967 15.7197C3.36032 15.579 3.55109 15.5 3.75 15.5ZM4.5 3.25C4.5 3.05109 4.42098 2.86032 4.28033 2.71967C4.13968 2.57902 3.94891 2.5 3.75 2.5C3.55109 2.5 3.36032 2.57902 3.21967 2.71967C3.07902 2.86032 3 3.05109 3 3.25V8.75C3 8.94891 3.07902 9.13968 3.21967 9.28033C3.36032 9.42098 3.55109 9.5 3.75 9.5C3.94891 9.5 4.13968 9.42098 4.28033 9.28033C4.42098 9.13968 4.5 8.94891 4.5 8.75V3.25ZM10 11.5C10.1989 11.5 10.3897 11.579 10.5303 11.7197C10.671 11.8603 10.75 12.0511 10.75 12.25V17.75C10.75 17.9489 10.671 18.1397 10.5303 18.2803C10.3897 18.421 10.1989 18.5 10 18.5C9.80109 18.5 9.61032 18.421 9.46967 18.2803C9.32902 18.1397 9.25 17.9489 9.25 17.75V12.25C9.25 12.0511 9.32902 11.8603 9.46967 11.7197C9.61032 11.579 9.80109 11.5 10 11.5ZM10.75 3.25C10.75 3.05109 10.671 2.86032 10.5303 2.71967C10.3897 2.57902 10.1989 2.5 10 2.5C9.80109 2.5 9.61032 2.57902 9.46967 2.71967C9.32902 2.86032 9.25 3.05109 9.25 3.25V4.75C9.25 4.94891 9.32902 5.13968 9.46967 5.28033C9.61032 5.42098 9.80109 5.5 10 5.5C10.1989 5.5 10.3897 5.42098 10.5303 5.28033C10.671 5.13968 10.75 4.94891 10.75 4.75V3.25ZM10 6.5C9.46957 6.5 8.96086 6.71071 8.58579 7.08579C8.21071 7.46086 8 7.96957 8 8.5C8 9.03043 8.21071 9.53914 8.58579 9.91421C8.96086 10.2893 9.46957 10.5 10 10.5C10.5304 10.5 11.0391 10.2893 11.4142 9.91421C11.7893 9.53914 12 9.03043 12 8.5C12 7.96957 11.7893 7.46086 11.4142 7.08579C11.0391 6.71071 10.5304 6.5 10 6.5ZM3.75 10.5C3.21957 10.5 2.71086 10.7107 2.33579 11.0858C1.96071 11.4609 1.75 11.9696 1.75 12.5C1.75 13.0304 1.96071 13.5391 2.33579 13.9142C2.71086 14.2893 3.21957 14.5 3.75 14.5C4.28043 14.5 4.78914 14.2893 5.16421 13.9142C5.53929 13.5391 5.75 13.0304 5.75 12.5C5.75 11.9696 5.53929 11.4609 5.16421 11.0858C4.78914 10.7107 4.28043 10.5 3.75 10.5ZM16.25 10.5C15.7196 10.5 15.2109 10.7107 14.8358 11.0858C14.4607 11.4609 14.25 11.9696 14.25 12.5C14.25 13.0304 14.4607 13.5391 14.8358 13.9142C15.2109 14.2893 15.7196 14.5 16.25 14.5C16.7804 14.5 17.2891 14.2893 17.6642 13.9142C18.0393 13.5391 18.25 13.0304 18.25 12.5C18.25 11.9696 18.0393 11.4609 17.6642 11.0858C17.2891 10.7107 16.7804 10.5 16.25 10.5Z'
                                            fill='white'
                                        />
                                    </svg>
                                    <div>Filter</div>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='13'
                                        height='13'
                                        viewBox='0 0 13 13'
                                        fill='none'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            clipRule='evenodd'
                                            d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                            fill='white'
                                            fillOpacity='0.37'
                                        />
                                    </svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='flex flex-col gap-1 z-[99999]' sideOffset={8}>
                                <div className='text-xs opacity-50 text-center'>More filters coming soon!</div>
                                {rootAdmin && (
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            setShowOnlyAdmin((s) => !s);
                                        }}
                                    >
                                        {showOnlyAdmin ? 'Show personal servers' : 'Show other servers'}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TabsList>
                            <TabsTrigger aria-label='View servers in a list layout.' value='list'>
                                <svg
                                    width='16'
                                    height='17'
                                    viewBox='0 0 16 17'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M1 2.3C1 2.02 1 1.88 1.054 1.773C1.10215 1.67903 1.17881 1.60272 1.273 1.555C1.38 1.5 1.52 1.5 1.8 1.5H14.2C14.48 1.5 14.62 1.5 14.727 1.554C14.821 1.60215 14.8973 1.67881 14.945 1.773C15 1.88 15 2.02 15 2.3V2.7C15 2.98 15 3.12 14.945 3.227C14.8973 3.32119 14.821 3.39785 14.727 3.446C14.62 3.5 14.48 3.5 14.2 3.5H1.8C1.52 3.5 1.38 3.5 1.273 3.446C1.17903 3.39785 1.10272 3.32119 1.055 3.227C1 3.12 1 2.98 1 2.7V2.3ZM1 14.3C1 14.02 1 13.88 1.054 13.773C1.10215 13.679 1.17881 13.6027 1.273 13.555C1.38 13.5 1.52 13.5 1.8 13.5H14.2C14.48 13.5 14.62 13.5 14.727 13.555C14.8208 13.6029 14.8971 13.6792 14.945 13.773C15 13.88 15 14.02 15 14.3V14.7C15 14.98 15 15.12 14.945 15.227C14.8971 15.3208 14.8208 15.3971 14.727 15.445C14.62 15.5 14.48 15.5 14.2 15.5H1.8C1.52 15.5 1.38 15.5 1.273 15.445C1.17919 15.3971 1.10289 15.3208 1.055 15.227C1 15.12 1 14.98 1 14.7V14.3ZM1 10.3C1 10.02 1 9.88 1.054 9.773C1.10215 9.67903 1.17881 9.60272 1.273 9.555C1.38 9.5 1.52 9.5 1.8 9.5H14.2C14.48 9.5 14.62 9.5 14.727 9.555C14.8208 9.60289 14.8971 9.67918 14.945 9.773C15 9.88 15 10.02 15 10.3V10.7C15 10.98 15 11.12 14.945 11.227C14.8971 11.3208 14.8208 11.3971 14.727 11.445C14.62 11.5 14.48 11.5 14.2 11.5H1.8C1.52 11.5 1.38 11.5 1.273 11.445C1.17919 11.3971 1.10289 11.3208 1.055 11.227C1 11.12 1 10.98 1 10.7V10.3ZM1 6.3C1 6.02 1 5.88 1.054 5.773C1.10215 5.67903 1.17881 5.60272 1.273 5.555C1.38 5.5 1.52 5.5 1.8 5.5H14.2C14.48 5.5 14.62 5.5 14.727 5.554C14.821 5.60215 14.8973 5.67881 14.945 5.773C15 5.88 15 6.02 15 6.3V6.7C15 6.98 15 7.12 14.945 7.227C14.8971 7.32082 14.8208 7.39711 14.727 7.445C14.62 7.5 14.48 7.5 14.2 7.5H1.8C1.52 7.5 1.38 7.5 1.273 7.446C1.17903 7.39785 1.10272 7.32119 1.055 7.227C1 7.12 1 6.98 1 6.7V6.3Z'
                                        fill='currentColor'
                                    />
                                </svg>
                            </TabsTrigger>
                            <TabsTrigger aria-label='View servers in a grid layout.' value='grid'>
                                <svg
                                    width='16'
                                    height='17'
                                    viewBox='0 0 16 17'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M1 3.1C1 2.54 1 2.26 1.109 2.046C1.20487 1.85785 1.35785 1.70487 1.546 1.609C1.76 1.5 2.04 1.5 2.6 1.5H5.4C5.96 1.5 6.24 1.5 6.454 1.609C6.64215 1.70487 6.79513 1.85785 6.891 2.046C7 2.26 7 2.54 7 3.1V3.9C7 4.46 7 4.74 6.891 4.954C6.79513 5.14215 6.64215 5.29513 6.454 5.391C6.24 5.5 5.96 5.5 5.4 5.5H2.6C2.04 5.5 1.76 5.5 1.546 5.391C1.35785 5.29513 1.20487 5.14215 1.109 4.954C1 4.74 1 4.46 1 3.9V3.1ZM9 3.1C9 2.54 9 2.26 9.109 2.046C9.20487 1.85785 9.35785 1.70487 9.546 1.609C9.76 1.5 10.04 1.5 10.6 1.5H13.4C13.96 1.5 14.24 1.5 14.454 1.609C14.6422 1.70487 14.7951 1.85785 14.891 2.046C15 2.26 15 2.54 15 3.1V3.9C15 4.46 15 4.74 14.891 4.954C14.7951 5.14215 14.6422 5.29513 14.454 5.391C14.24 5.5 13.96 5.5 13.4 5.5H10.6C10.04 5.5 9.76 5.5 9.546 5.391C9.35785 5.29513 9.20487 5.14215 9.109 4.954C9 4.74 9 4.46 9 3.9V3.1ZM1 8.1C1 7.54 1 7.26 1.109 7.046C1.20487 6.85785 1.35785 6.70487 1.546 6.609C1.76 6.5 2.04 6.5 2.6 6.5H5.4C5.96 6.5 6.24 6.5 6.454 6.609C6.64215 6.70487 6.79513 6.85785 6.891 7.046C7 7.26 7 7.54 7 8.1V8.9C7 9.46 7 9.74 6.891 9.954C6.79513 10.1422 6.64215 10.2951 6.454 10.391C6.24 10.5 5.96 10.5 5.4 10.5H2.6C2.04 10.5 1.76 10.5 1.546 10.391C1.35785 10.2951 1.20487 10.1422 1.109 9.954C1 9.74 1 9.46 1 8.9V8.1ZM9 8.1C9 7.54 9 7.26 9.109 7.046C9.20487 6.85785 9.35785 6.70487 9.546 6.609C9.76 6.5 10.04 6.5 10.6 6.5H13.4C13.96 6.5 14.24 6.5 14.454 6.609C14.6422 6.70487 14.7951 6.85785 14.891 7.046C15 7.26 15 7.54 15 8.1V8.9C15 9.46 15 9.74 14.891 9.954C14.7951 10.1422 14.6422 10.2951 14.454 10.391C14.24 10.5 13.96 10.5 13.4 10.5H10.6C10.04 10.5 9.76 10.5 9.546 10.391C9.35785 10.2951 9.20487 10.1422 9.109 9.954C9 9.74 9 9.46 9 8.9V8.1ZM1 13.1C1 12.54 1 12.26 1.109 12.046C1.20487 11.8578 1.35785 11.7049 1.546 11.609C1.76 11.5 2.04 11.5 2.6 11.5H5.4C5.96 11.5 6.24 11.5 6.454 11.609C6.64215 11.7049 6.79513 11.8578 6.891 12.046C7 12.26 7 12.54 7 13.1V13.9C7 14.46 7 14.74 6.891 14.954C6.79513 15.1422 6.64215 15.2951 6.454 15.391C6.24 15.5 5.96 15.5 5.4 15.5H2.6C2.04 15.5 1.76 15.5 1.546 15.391C1.35785 15.2951 1.20487 15.1422 1.109 14.954C1 14.74 1 14.46 1 13.9V13.1ZM9 13.1C9 12.54 9 12.26 9.109 12.046C9.20487 11.8578 9.35785 11.7049 9.546 11.609C9.76 11.5 10.04 11.5 10.6 11.5H13.4C13.96 11.5 14.24 11.5 14.454 11.609C14.6422 11.7049 14.7951 11.8578 14.891 12.046C15 12.26 15 12.54 15 13.1V13.9C15 14.46 15 14.74 14.891 14.954C14.7951 15.1422 14.6422 15.2951 14.454 15.391C14.24 15.5 13.96 15.5 13.4 15.5H10.6C10.04 15.5 9.76 15.5 9.546 15.391C9.35785 15.2951 9.20487 15.1422 9.109 14.954C9 14.74 9 14.46 9 13.9V13.1Z'
                                        fill='currentColor'
                                    />
                                </svg>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>
                {!servers ? (
                    <></>
                ) : (
                    <>
                        <TabsContent value='list'>
                            <Pagination data={servers} onPageSelect={setPage}>
                                {({ items }) =>
                                    items.length > 0 ? (
                                        items.map((server, index) => (
                                            <div
                                                key={server.uuid}
                                                className='transform-gpu skeleton-anim-2 mb-4'
                                                style={{
                                                    animationDelay: `${index * 50 + 50}ms`,
                                                    animationTimingFunction:
                                                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                }}
                                            >
                                                <ServerRow className='flex-row' key={server.uuid} server={server} />
                                            </div>
                                        ))
                                    ) : (
                                        <p className={`text-center text-sm text-zinc-400`}>
                                            {showOnlyAdmin
                                                ? 'There are no other servers to display.'
                                                : 'There are no servers associated with your account.'}
                                        </p>
                                    )
                                }
                            </Pagination>
                        </TabsContent>
                        <TabsContent value='grid'>
                            <div className='grid grid-cols-2 gap-4'>
                                <Pagination data={servers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            items.map((server, index) => (
                                                <div
                                                    key={server.uuid}
                                                    className='transform-gpu skeleton-anim-2 mb-4 w-full'
                                                    style={{
                                                        animationDelay: `${index * 50 + 50}ms`,
                                                        animationTimingFunction:
                                                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                    }}
                                                >
                                                    <ServerRow
                                                        className='!items-start flex-col w-full gap-4 [&>div~div]:w-full'
                                                        key={server.uuid}
                                                        server={server}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <p className={`text-center text-sm text-zinc-400`}>
                                                {showOnlyAdmin
                                                    ? 'There are no other servers to display.'
                                                    : 'There are no servers associated with your account.'}
                                            </p>
                                        )
                                    }
                                </Pagination>
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </PageContentBlock>
    );
};
