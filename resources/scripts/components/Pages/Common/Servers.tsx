import { useEffect, useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { usePage, Link } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import debounce from 'lodash/debounce';

import ServerRow from '@/components/dashboard/ServerRow';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';
import { usePersistedState } from '@/plugins/usePersistedState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import CreateNew from '@/components/Additonal/CreateNew';

export default () => {
    const { props: { page: defaultPage = 1, auth } } = usePage();
    const [page, setPage] = useState(defaultPage);
    const [searchQuery, setSearchQuery] = useState('');
    
    const uuid = auth.user.uuid;
    const rootAdmin = auth.user.rootAdmin;
    
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [displayOption, setDisplayOption] = usePersistedState(`${uuid}:display_option`, 'list');

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const debouncedSearch = useCallback(
        debounce((value: string) => setSearchQuery(value), 300),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const filteredServers = useMemo(() => {
        if (!servers || !searchQuery.trim()) return servers;

        const query = searchQuery.toLowerCase();
        return {
            ...servers,
            items: servers.items.filter(server => 
                server.name.toLowerCase().includes(query) ||
                server.description?.toLowerCase().includes(query) ||
                server.uuid.toLowerCase().includes(query)
            )
        };
    }, [servers, searchQuery]);

    useEffect(() => {
        if (servers?.pagination.currentPage > 1 && servers.items.length === 0) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage, servers?.items.length]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    if (error) {
        console.error('Error fetching servers:', error);
    }

    const renderServerGrid = (items: Server[]) => (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {items.map((server, index) => (
                <div
                    key={server.uuid}
                    className='transform-gpu skeleton-anim-2 mb-4'
                    style={{
                        animationDelay: `${index * 50 + 50}ms`,
                        animationTimingFunction: 'linear',
                    }}
                >
                    <ServerRow
                        className='!items-start flex-col w-full gap-4 [&>div~div]:w-full'
                        server={server}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <PageContentBlock title='Servers' showFlashKey='servers'>
            <Tabs defaultValue={displayOption} onValueChange={setDisplayOption} className='w-full'>
                <MainPageHeader title={showOnlyAdmin ? 'Other Servers' : 'Your Servers'}>
                    <div className='flex gap-4 items-center'>
                        <div className='relative w-64'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none' />
                            <Input
                                type='text'
                                onChange={handleSearchChange}
                                placeholder='Search servers...'
                                className='pl-9 dark:bg-black bg-zinc-300 '
                            />
                        </div>
                        {rootAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center justify-between w-48 px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-200 rounded-md border border-zinc-800 hover:bg-zinc-300 dark:text-zinc-200 dark:bg-black transition-colors">
                                    {showOnlyAdmin ? "Other's Servers" : "Personal Servers"}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    <DropdownMenuRadioGroup value={showOnlyAdmin ? "others" : "personal"} onValueChange={(value) => setShowOnlyAdmin(value === "others")}>
                                        <DropdownMenuRadioItem value="personal">Personal Servers</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="others">Other's Servers</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <TabsList>
                            <TabsTrigger value='list'>List View</TabsTrigger>
                            <TabsTrigger value='grid'>Grid View</TabsTrigger>
                        </TabsList>
                    </div>
                </MainPageHeader>

                {!servers ? (
                    <div className='w-full flex items-center justify-center p-6'>
                        <span className='text-sm text-zinc-400'>Loading servers...</span>

                    </div>
                ) : (
                    <>
                        <TabsContent value='list'>
    <Pagination data={filteredServers} onPageSelect={setPage}>
        {({ items }) => items.length > 0 ? (
            <div className='space-y-4'>
                {items.map(server => (
                    <ServerRow key={server.uuid} server={server} />
                ))}
            </div>
        ) : (
            <div className="flex items-center justify-center min-h-[400px]">
                <CreateNew 
                    go="/deploy" 
                    text={searchQuery.trim() 
                        ? 'No matches found - Deploy a new server?'
                        : showOnlyAdmin 
                            ? 'No other servers - Deploy a new one?'
                            : 'No servers found - Deploy your first server!'
                    }
                />
            </div>
        )}
    </Pagination>
</TabsContent>

<TabsContent value='grid'>
    <Pagination data={filteredServers} onPageSelect={setPage}>
        {({ items }) => items.length > 0 ? (
            renderServerGrid(items)
        ) : (
            <div className="flex items-center justify-center min-h-[400px]">
                <CreateNew 
                    go="/deploy" 
                    text={searchQuery.trim() 
                        ? 'No matches found - Deploy a new server?'
                        : showOnlyAdmin 
                            ? 'No other servers - Deploy a new one?'
                            : 'No servers found - Deploy your first server!'
                    }
                />
            </div>
        )}
    </Pagination>
</TabsContent>
                    </>
                )}
            </Tabs>
        </PageContentBlock>
    );
};