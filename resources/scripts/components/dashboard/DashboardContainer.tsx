import { ArrowDown01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';
import getServers from '@/api/getServers';
import type { PaginatedResult } from '@/api/http';
import type { Server } from '@/api/server/getServer';
import ServerRow from '@/components/dashboard/ServerRow';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHeader } from '@/contexts/HeaderContext';

import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';

import { Button } from '../ui/button';
import HeaderCentered from './header/HeaderCentered';
import SearchSection from './header/SearchSection';

const DashboardContainer = () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [serverViewMode, setServerViewMode] = usePersistedState<'owner' | 'admin-all' | 'all'>(
        `${uuid}:server_view_mode`,
        'owner',
    );

    const { setHeaderActions, clearHeaderActions } = useHeader();

    const [dashboardDisplayOption, setDashboardDisplayOption] = usePersistedState(
        `${uuid}:dashboard_display_option`,
        'list',
    );

    const getApiType = (): string | undefined => {
        if (serverViewMode === 'owner') return 'owner'; // Servers the User owns
        if (serverViewMode === 'admin-all') return 'admin-all'; // All servers(Admin only)
        if (serverViewMode === 'all') return 'all'; // All servers user has Access too. (Subusers and owned)
        return undefined;
    };

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', serverViewMode, page],
        () => getServers({ page, type: getApiType() }),
        { revalidateOnFocus: false },
    );

    const handleFilterToggle = useCallback(() => {
        setShowOnlyAdmin((s) => !s);
    }, [setShowOnlyAdmin]);

    const searchSection = useMemo(
        () => (
            <HeaderCentered>
                <SearchSection className='max-w-128 xl:w-[30vw] hidden md:flex ' />
            </HeaderCentered>
        ),
        [],
    );

    const viewTabs = useMemo(
        () => (
            <Tabs value={dashboardDisplayOption} onValueChange={setDashboardDisplayOption} className='lg:block hidden'>
                <TabsList>
                    <TabsTrigger aria-label='View servers in a list layout.' value='list'>
                        <svg width='13' height='14' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                d='M1 2.3C1 2.02 1 1.88 1.054 1.773C1.10215 1.67903 1.17881 1.60272 1.273 1.555C1.38 1.5 1.52 1.5 1.8 1.5H14.2C14.48 1.5 14.62 1.5 14.727 1.554C14.821 1.60215 14.8973 1.67881 14.945 1.773C15 1.88 15 2.02 15 2.3V2.7C15 2.98 15 3.12 14.945 3.227C14.8973 3.32119 14.821 3.39785 14.727 3.446C14.62 3.5 14.48 3.5 14.2 3.5H1.8C1.52 3.5 1.38 3.5 1.273 3.446C1.17903 3.39785 1.10272 3.32119 1.055 3.227C1 3.12 1 2.98 1 2.7V2.3ZM1 14.3C1 14.02 1 13.88 1.054 13.773C1.10215 13.679 1.17881 13.6027 1.273 13.555C1.38 13.5 1.52 13.5 1.8 13.5H14.2C14.48 13.5 14.62 13.5 14.727 13.555C14.8208 13.6029 14.8971 13.6792 14.945 13.773C15 13.88 15 14.02 15 14.3V14.7C15 14.98 15 15.12 14.945 15.227C14.8971 15.3208 14.8208 15.3971 14.727 15.445C14.62 15.5 14.48 15.5 14.2 15.5H1.8C1.52 15.5 1.38 15.5 1.273 15.445C1.17919 15.3971 1.10289 15.3208 1.055 15.227C1 15.12 1 14.98 1 14.7V14.3ZM1 10.3C1 10.02 1 9.88 1.054 9.773C1.10215 9.67903 1.17881 9.60272 1.273 9.555C1.38 9.5 1.52 9.5 1.8 9.5H14.2C14.48 9.5 14.62 9.5 14.727 9.555C14.8208 9.60289 14.8971 9.67918 14.945 9.773C15 9.88 15 10.02 15 10.3V10.7C15 10.98 15 11.12 14.945 11.227C14.8971 11.3208 14.8208 11.3971 14.727 11.445C14.62 11.5 14.48 11.5 14.2 11.5H1.8C1.52 11.5 1.38 11.5 1.273 11.445C1.17919 11.3971 1.10289 11.3208 1.055 11.227C1 11.12 1 10.98 1 10.7V10.3ZM1 6.3C1 6.02 1 5.88 1.054 5.773C1.10215 5.67903 1.17881 5.60272 1.273 5.555C1.38 5.5 1.52 5.5 1.8 5.5H14.2C14.48 5.5 14.62 5.5 14.727 5.554C14.821 5.60215 14.8973 5.67881 14.945 5.773C15 5.88 15 6.02 15 6.3V6.7C15 6.98 15 7.12 14.945 7.227C14.8971 7.32082 14.8208 7.39711 14.727 7.445C14.62 7.5 14.48 7.5 14.2 7.5H1.8C1.52 7.5 1.38 7.5 1.273 7.446C1.17903 7.39785 1.10272 7.32119 1.055 7.227C1 7.12 1 6.98 1 6.7V6.3Z'
                                fill='currentColor'
                            />
                        </svg>
                    </TabsTrigger>
                    <TabsTrigger aria-label='View servers in a grid layout.' value='grid'>
                        <svg width='13' height='14' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                d='M1 3.1C1 2.54 1 2.26 1.109 2.046C1.20487 1.85785 1.35785 1.70487 1.546 1.609C1.76 1.5 2.04 1.5 2.6 1.5H5.4C5.96 1.5 6.24 1.5 6.454 1.609C6.64215 1.70487 6.79513 1.85785 6.891 2.046C7 2.26 7 2.54 7 3.1V3.9C7 4.46 7 4.74 6.891 4.954C6.79513 5.14215 6.64215 5.29513 6.454 5.391C6.24 5.5 5.96 5.5 5.4 5.5H2.6C2.04 5.5 1.76 5.5 1.546 5.391C1.35785 5.29513 1.20487 5.14215 1.109 4.954C1 4.74 1 4.46 1 3.9V3.1ZM9 3.1C9 2.54 9 2.26 9.109 2.046C9.20487 1.85785 9.35785 1.70487 9.546 1.609C9.76 1.5 10.04 1.5 10.6 1.5H13.4C13.96 1.5 14.24 1.5 14.454 1.609C14.6422 1.70487 14.7951 1.85785 14.891 2.046C15 2.26 15 2.54 15 3.1V3.9C15 4.46 15 4.74 14.891 4.954C14.7951 5.14215 14.6422 5.29513 14.454 5.391C14.24 5.5 13.96 5.5 13.4 5.5H10.6C10.04 5.5 9.76 5.5 9.546 5.391C9.35785 5.29513 9.20487 5.14215 9.109 4.954C9 4.74 9 4.46 9 3.9V3.1ZM1 8.1C1 7.54 1 7.26 1.109 7.046C1.20487 6.85785 1.35785 6.70487 1.546 6.609C1.76 6.5 2.04 6.5 2.6 6.5H5.4C5.96 6.5 6.24 6.5 6.454 6.609C6.64215 6.70487 6.79513 6.85785 6.891 7.046C7 7.26 7 7.54 7 8.1V8.9C7 9.46 7 9.74 6.891 9.954C6.79513 10.1422 6.64215 10.2951 6.454 10.391C6.24 10.5 5.96 10.5 5.4 10.5H2.6C2.04 10.5 1.76 10.5 1.546 10.391C1.35785 10.2951 1.20487 10.1422 1.109 9.954C1 9.74 1 9.46 1 8.9V8.1ZM9 8.1C9 7.54 9 7.26 9.109 7.046C9.20487 6.85785 9.35785 6.70487 9.546 6.609C9.76 6.5 10.04 6.5 10.6 6.5H13.4C13.96 6.5 14.24 6.5 14.454 6.609C14.6422 6.70487 14.7951 6.85785 14.891 7.046C15 7.26 15 7.54 15 8.1V8.9C15 9.46 15 9.74 14.891 9.954C14.7951 10.1422 14.6422 10.2951 14.454 10.391C14.24 10.5 13.96 10.5 13.4 10.5H10.6C10.04 10.5 9.76 10.5 9.546 10.391C9.35785 10.2951 9.20487 10.1422 9.109 9.954C9 9.74 9 9.46 9 8.9V8.1ZM1 13.1C1 12.54 1 12.26 1.109 12.046C1.20487 11.8578 1.35785 11.7049 1.546 11.609C1.76 11.5 2.04 11.5 2.6 11.5H5.4C5.96 11.5 6.24 11.5 6.454 11.609C6.64215 11.7049 6.79513 11.8578 6.891 12.046C7 12.26 7 12.54 7 13.1V13.9C7 14.46 7 14.74 6.891 14.954C6.79513 15.1422 6.64215 15.2951 6.454 15.391C6.24 15.5 5.96 15.5 5.4 15.5H2.6C2.04 15.5 1.76 15.5 1.546 15.391C1.35785 15.2951 1.20487 15.1422 1.109 14.954C1 14.74 1 14.46 1 13.9V13.1ZM9 13.1C9 12.54 9 12.26 9.109 12.046C9.20487 11.8578 9.35785 11.7049 9.546 11.609C9.76 11.5 10.04 11.5 10.6 11.5H13.4C13.96 11.5 14.24 11.5 14.454 11.609C14.6422 11.7049 14.7951 11.8578 14.891 12.046C15 12.26 15 12.54 15 13.1V13.9C15 14.46 15 14.74 14.891 14.954C14.7951 15.1422 14.6422 15.2951 14.454 15.391C14.24 15.5 13.96 15.5 13.4 15.5H10.6C10.04 15.5 9.76 15.5 9.546 15.391C9.35785 15.2951 1.20487 15.1422 9.109 14.954C9 14.74 9 14.46 9 13.9V13.1Z'
                                fill='currentColor'
                            />
                        </svg>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        ),
        [dashboardDisplayOption, setDashboardDisplayOption],
    );

    const filterDropdown = useMemo(
        () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size={'sm'} variant={'secondary'} className='px-1 pl-3 gap-1 rounded-full'>
                        <div className='flex flex-row items-center gap-1'>
                            <div className='flex flex-row items-center gap-1.5'>
                                <HugeiconsIcon size={16} strokeWidth={2} icon={FilterIcon} className='size-4' />
                                Filter
                            </div>
                            <HugeiconsIcon size={16} strokeWidth={2} icon={ArrowDown01Icon} />
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='flex flex-col gap-1 z-99999' sideOffset={8}>
                    <DropdownMenuItem
                        onSelect={() => setServerViewMode('owner')}
                        className={serverViewMode === 'owner' ? 'bg-accent/20' : ''}
                    >
                        Your Servers Only
                    </DropdownMenuItem>

                    {rootAdmin && (
                        <>
                            <DropdownMenuItem
                                onSelect={() => setServerViewMode('admin-all')}
                                className={serverViewMode === 'admin-all' ? 'bg-accent/20' : ''}
                            >
                                All Servers (Admin)
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuItem
                        onSelect={() => setServerViewMode('all')}
                        className={serverViewMode === 'all' ? 'bg-accent/20' : ''}
                    >
                        All Servers
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [rootAdmin, showOnlyAdmin],
    );

    useEffect(() => {
        setHeaderActions([searchSection, viewTabs, filterDropdown]);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions, searchSection, viewTabs, filterDropdown]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error, clearAndAddHttpError, clearFlashes]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            {!servers ? (
                <></>
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <div
                                className={
                                    dashboardDisplayOption === 'grid'
                                        ? 'flex flex-wrap gap-4 max-lg:flex-col max-lg:gap-0'
                                        : ''
                                }
                            >
                                {items.map((server, index) => (
                                    <div
                                        key={`${server.uuid}-${dashboardDisplayOption}`}
                                        className={`transform-gpu skeleton-anim-2 ${
                                            dashboardDisplayOption === 'grid'
                                                ? items.length === 1
                                                    ? 'w-[calc(50%-0.5rem)] max-lg:w-full'
                                                    : 'w-[calc(50%-0.5rem)] max-lg:w-full'
                                                : 'mb-4'
                                        } max-lg:mb-4`}
                                        style={{
                                            animationDelay: `${index * 50 + 50}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <ServerRow
                                            className={
                                                dashboardDisplayOption === 'list'
                                                    ? 'flex-row'
                                                    : 'items-start! flex-col w-full gap-4 [&>div~div]:w-full max-lg:flex-row max-lg:items-center max-lg:gap-0 max-lg:[&>div~div]:w-auto'
                                            }
                                            key={server.uuid}
                                            server={server}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className={`text-center text-sm text-zinc-400 absolute w-full left-1/2 -translate-x-1/2`}
                            >
                                <p className='max-w-sm mx-auto mb-5'>
                                    {serverViewMode === 'admin-all'
                                        ? 'There are no other servers to display.'
                                        : serverViewMode === 'all'
                                          ? 'No Server Shared With your Account'
                                          : 'There are no servers associated with your account.'}
                                </p>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                    {serverViewMode === 'admin-all' ? 'No other servers found' : 'No servers found'}
                                </h3>
                            </div>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};

export default DashboardContainer;
