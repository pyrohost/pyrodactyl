import { ActivityLog } from '@definitions/user';
// FIXME: add icons back
import clsx from 'clsx';
// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';

import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import FolderIcon from '@/components/elements/hugeicons/Folder';
import TerminalIcon from '@/components/elements/hugeicons/Terminal';

import { formatObjectToIdentString } from '@/lib/objects';

import useLocationHash from '@/plugins/useLocationHash';

import style from './style.module.css';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;

    return (
        <div className={'grid grid-cols-10 py-4 border-b-2 border-zinc-800 last:rounded-b last:border-0 group'}>
            <div className={'hidden sm:flex sm:col-span-1 items-center justify-center select-none'}>
                <div className={'flex items-center w-10 h-10 rounded-full bg-zinc-600 overflow-hidden'}>
                    <img src={actor?.image} />
                </div>
            </div>
            <div className={'col-span-10 sm:col-span-9 flex'}>
                <div className={'flex-1 px-4 sm:px-0'}>
                    <div className={'flex items-center text-zinc-50'}>
                        {/* <Tooltip placement={'top'} content={actor?.email || 'System User'}> */}
                        <span>{actor?.username || 'System'}</span>
                        {/* </Tooltip> */}
                        <span className={'text-zinc-400'}>&nbsp;&mdash;&nbsp;</span>
                        <Link
                            to={`#${pathTo({ event: activity.event })}`}
                            className={'transition-colors duration-75 active:text-blue-400 hover:text-red-400'}
                        >
                            {activity.event}
                        </Link>
                        <div className={clsx(style.icons, 'group-hover:text-zinc-300')}>
                            {activity.isApi && <TerminalIcon fill='contentColor' />}
                            {activity.event.startsWith('server:sftp.') && (
                                // <Tooltip placement={'top'} content={'Using SFTP'}>
                                <FolderIcon fill='contentColor' />
                            )}
                            {children}
                        </div>
                    </div>
                    {!activity.hasAdditionalMetadata && (
                        <p className={style.description}>
                            <pre>{formatObjectToIdentString(activity.properties)}</pre>
                        </p>
                    )}
                    <div className={'mt-1 flex items-center text-sm'}>
                        {activity.ip && (
                            <span>
                                {activity.ip}
                                <span className={'text-zinc-400'}>&nbsp;|&nbsp;</span>
                            </span>
                        )}
                        {/* <Tooltip placement={'right'} content={format(activity.timestamp, 'MMM do, yyyy H:mm:ss')}> */}
                        <span>{formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}</span>
                        {/* </Tooltip> */}
                    </div>
                </div>
                {activity.hasAdditionalMetadata && <ActivityLogMetaButton meta={activity.properties} />}
            </div>
        </div>
    );
};
