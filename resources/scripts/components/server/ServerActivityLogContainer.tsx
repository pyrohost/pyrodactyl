import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import FlashMessageRender from '@/components/FlashMessageRender';
import ContentBox from '@/components/elements/ContentBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import { styles as btnStyles } from '@/components/elements/button/index';
import PaginationFooter from '@/components/elements/table/PaginationFooter';

import { ActivityLogFilters } from '@/api/account/activity';
import { useActivityLogs } from '@/api/server/activity';

import { useFlashKey } from '@/plugins/useFlash';
// FIXME: add icons back
import useLocationHash from '@/plugins/useLocationHash';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({
        page: 1,
        sorts: { timestamp: -1 },
    });

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((value) => ({
            ...value,
            filters: { ip: hash.ip, event: hash.event },
        }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <ServerContentBlock title={'Activity Log'}>
            <FlashMessageRender byKey={'server:activity'} />
            <ContentBox title='Server Activity Logs'>
                {(filters.filters?.event || filters.filters?.ip) && (
                    <div className={'flex justify-end mb-2'}>
                        <Link
                            to={'#'}
                            className={clsx(btnStyles.button, btnStyles.text, 'w-full sm:w-auto')}
                            onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                        >
                            Clear Filters
                            {/* FIXME: X icon */}
                        </Link>
                    </div>
                )}
                {!data && isValidating ? (
                    <Spinner centered />
                ) : !data?.items.length ? (
                    <p className={'text-sm text-center text-zinc-400'}>No activity logs available for this server.</p>
                ) : (
                    <div>
                        {data?.items.map((activity) => (
                            <ActivityLogEntry key={activity.id} activity={activity}>
                                <span />
                            </ActivityLogEntry>
                        ))}
                    </div>
                )}
                {data && (
                    <PaginationFooter
                        pagination={data.pagination}
                        onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                    />
                )}
            </ContentBox>
        </ServerContentBlock>
    );
};
