import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import HugeIconsDownload from '@/components/elements/hugeicons/Download';
import HugeIconsFilter from '@/components/elements/hugeicons/Filter';
import HugeIconsHistory from '@/components/elements/hugeicons/History';
import HugeIconsSearch from '@/components/elements/hugeicons/Search';
import HugeIconsX from '@/components/elements/hugeicons/X';
import { Input } from '@/components/elements/inputs';
import PaginationFooter from '@/components/elements/table/PaginationFooter';

import { ActivityLogFilters, useActivityLogs } from '@/api/account/activity';

import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';

const ActivityLogContainer = () => {
    const { t } = useTranslation();
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [dateRange, setDateRange] = useState('all');

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
        refreshInterval: autoRefresh ? 30000 : 0, // Auto-refresh every 30 seconds
    });

    // Extract unique event types for filter dropdown
    const eventTypes = useMemo(() => {
        if (!data?.items) return [];
        const types = [...new Set(data.items.map((item) => item.event))];
        return types.sort();
    }, [data?.items]);

    // Filter data based on search term and event type
    const filteredData = useMemo(() => {
        if (!data?.items) return data;

        let filtered = data.items;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.relationships.actor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    JSON.stringify(item.properties).toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (selectedEventType) {
            filtered = filtered.filter((item) => item.event === selectedEventType);
        }

        // Apply date range filtering
        if (dateRange !== 'all') {
            const now = new Date();
            const cutoff = new Date();

            switch (dateRange) {
                case '1h':
                    cutoff.setHours(now.getHours() - 1);
                    break;
                case '24h':
                    cutoff.setDate(now.getDate() - 1);
                    break;
                case '7d':
                    cutoff.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    cutoff.setDate(now.getDate() - 30);
                    break;
            }

            filtered = filtered.filter((item) => new Date(item.timestamp) >= cutoff);
        }

        return { ...data, items: filtered };
    }, [data, searchTerm, selectedEventType, dateRange]);

    const exportLogs = () => {
        if (!filteredData?.items) return;

        const csvContent = [
            ['Timestamp', 'Event', 'Actor', 'IP Address', 'Properties'].join(','),
            ...filteredData.items.map((item) =>
                [
                    new Date(item.timestamp).toISOString(),
                    item.event,
                    item.relationships.actor?.username || 'System',
                    item.ip || '',
                    JSON.stringify(item.properties).replace(/"/g, '""'),
                ]
                    .map((field) => `"${field}"`)
                    .join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearAllFilters = () => {
        setFilters((value) => ({ ...value, filters: {} }));
        setSearchTerm('');
        setSelectedEventType('');
        setDateRange('all');
    };

    const hasActiveFilters =
        filters.filters?.event || filters.filters?.ip || searchTerm || selectedEventType || dateRange !== 'all';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        setShowFilters(!showFilters);
                        break;
                    case 'r':
                        e.preventDefault();
                        setAutoRefresh(!autoRefresh);
                        break;
                    case 'e':
                        e.preventDefault();
                        exportLogs();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showFilters, autoRefresh]);

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={t('activity_log.title')}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <FlashMessageRender byKey={'account'} />

                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title={t('activity_log.log')}>
                        <div className='flex gap-2 items-center flex-wrap'>
                            <ActionButton
                                variant='secondary'
                                onClick={() => setShowFilters(!showFilters)}
                                className='flex items-center gap-2'
                                title={t('activity_log.toggle_filters')}
                            >
                                <HugeIconsFilter className='w-4 h-4' fill='currentColor' />
                                {t('Filters')}
                                {hasActiveFilters && <span className='w-2 h-2 bg-blue-500 rounded-full'></span>}
                            </ActionButton>
                            <ActionButton
                                variant={autoRefresh ? 'primary' : 'secondary'}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className='flex items-center gap-2'
                                title={t('activity_log.auto_refresh')}
                            >
                                {autoRefresh ? (
                                    <HugeIconsX className='w-4 h-4' fill='currentColor' />
                                ) : (
                                    <HugeIconsSearch className='w-4 h-4' fill='currentColor' />
                                )}
                                {autoRefresh ? t('live') : t('refresh')}
                            </ActionButton>
                            <ActionButton
                                variant='secondary'
                                onClick={exportLogs}
                                disabled={!filteredData?.items?.length}
                                className='flex items-center gap-2'
                                title={t('activity_log.export_csv')}
                            >
                                <HugeIconsDownload className='w-4 h-4' fill='currentColor' />
                                {t('activity_log.export')}
                            </ActionButton>
                        </div>
                    </MainPageHeader>
                </div>

                {showFilters && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '100ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                            <div className='flex items-center gap-2 mb-4'>
                                <div className='w-5 h-5 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                    <HugeIconsFilter className='w-2.5 h-2.5 text-zinc-400' fill='currentColor' />
                                </div>
                                <h3 className='text-base font-semibold text-zinc-100'>Filters</h3>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-zinc-300 mb-2'>Search</label>
                                    <div className='relative'>
                                        <HugeIconsSearch
                                            className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10'
                                            fill='currentColor'
                                        />
                                        <Input.Text
                                            type='text'
                                            placeholder='Search events, IPs, users...'
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-zinc-300 mb-2'>Event Type</label>
                                    <Select
                                        value={selectedEventType}
                                        onChange={(e) => setSelectedEventType(e.target.value)}
                                        className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-zinc-500 transition-colors duration-150'
                                    >
                                        <option value='' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.all_events')}
                                        </option>
                                        {eventTypes.map((type) => (
                                            <option
                                                key={type}
                                                value={type}
                                                style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                            >
                                                {type}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-zinc-300 mb-2'>Time Range</label>
                                    <Select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-zinc-500 transition-colors duration-150'
                                    >
                                        <option value='all' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.all_time')}
                                        </option>
                                        <option value='1h' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.last_hour')}
                                        </option>
                                        <option value='24h' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.last_24')}
                                        </option>
                                        <option value='7d' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.last_7')}
                                        </option>
                                        <option value='30d' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                            {t('activity_log.last_30')}
                                        </option>
                                    </Select>
                                </div>

                                <div className='flex items-end'>
                                    {hasActiveFilters && (
                                        <ActionButton
                                            variant='secondary'
                                            onClick={clearAllFilters}
                                            className='flex items-center gap-2 w-full'
                                        >
                                            <HugeIconsX className='w-4 h-4' fill='currentColor' />
                                            {t('activity_log.clear_filters')}
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '125ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                        <div className='flex items-center gap-2 mb-4'>
                            <div className='w-5 h-5 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                <HugeIconsHistory className='w-2.5 h-2.5 text-zinc-400' fill='currentColor' />
                            </div>
                            <h3 className='text-base font-semibold text-zinc-100'>{t('activity_log.events')}</h3>
                            {filteredData?.items && (
                                <span className='text-sm text-zinc-400'>
                                    ({filteredData.items.length} {filteredData.items.length === 1 ? t('common.event') : t('common.events')})
                                </span>
                            )}
                        </div>

                        {!data && isValidating ? (
                            <Spinner centered />
                        ) : !filteredData?.items?.length ? (
                            <div className='text-center py-12'>
                                <HugeIconsHistory className='w-16 h-16 text-zinc-600 mb-4' fill='currentColor' />
                                <h3 className='text-lg font-semibold text-zinc-300 mb-2'>
                                    {hasActiveFilters ? 'No Matching Activity' : 'No Activity Yet'}
                                </h3>
                                <p className='text-sm text-zinc-400 mb-4 max-w-lg mx-auto leading-relaxed'>
                                    {hasActiveFilters
                                        ? t('activity_log.try_adjust')
                                        : t('activity_log.no_logs')}
                                </p>
                                {hasActiveFilters && (
                                    <div className='flex gap-2 justify-center'>
                                        <ActionButton variant='secondary' onClick={clearAllFilters}>
                                            {t('activity_log.clear_filters')}
                                        </ActionButton>
                                        <ActionButton variant='secondary' onClick={() => setShowFilters(true)}>
                                            {t('activity_log.adjust_filters')}
                                        </ActionButton>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='divide-y divide-zinc-800/30'>
                                {filteredData.items.map((activity) => (
                                    <ActivityLogEntry key={activity.id} activity={activity}>
                                        {typeof activity.properties.useragent === 'string' && <span></span>}
                                    </ActivityLogEntry>
                                ))}
                            </div>
                        )}

                        {data && (
                            <div className='mt-4'>
                                <PaginationFooter
                                    pagination={data.pagination}
                                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default ActivityLogContainer;
