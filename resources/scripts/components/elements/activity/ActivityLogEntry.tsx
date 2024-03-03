import { Link } from 'react-router-dom';
// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { formatDistanceToNowStrict } from 'date-fns';
import { ActivityLog } from '@definitions/user';
import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
// FIXME: add icons back
import clsx from 'clsx';
import style from './style.module.css';
import useLocationHash from '@/plugins/useLocationHash';
// import { getObjectKeys, isObject } from '@/lib/objects';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

// function wrapProperties(value: unknown): any {
//     if (value === null || typeof value === 'string' || typeof value === 'number') {
//         return `<strong>${String(value)}</strong>`;
//     }

//     if (isObject(value)) {
//         return getObjectKeys(value).reduce((obj, key) => {
//             if (key === 'count' || (typeof key === 'string' && key.endsWith('_count'))) {
//                 return { ...obj, [key]: value[key] };
//             }
//             return { ...obj, [key]: wrapProperties(value[key]) };
//         }, {} as Record<string, unknown>);
//     }

//     if (Array.isArray(value)) {
//         return value.map(wrapProperties);
//     }

//     return value;
// }

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;
    // const properties = wrapProperties(activity.properties);

    return (
        <div className={'grid grid-cols-10 py-4 border-b-2 border-zinc-800 last:rounded-b last:border-0 group'}>
            <div className={'hidden sm:flex sm:col-span-1 items-center justify-center select-none'}>
                <div className={'flex items-center w-10 h-10 rounded-full bg-zinc-600 overflow-hidden'}>
                    {/* <Avatar name={actor?.uuid || 'system'} /> */}
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
                            className={'transition-colors duration-75 active:text-blue-400 hover:text-blue-400'}
                        >
                            {activity.event}
                        </Link>
                        <div className={clsx(style.icons, 'group-hover:text-zinc-300')}>
                            {activity.isApi && (
                                // <Tooltip placement={'top'} content={'Using API Key'}>
                                // <TerminalIcon />
                                <div>terminal icon</div>
                                // </Tooltip>
                            )}
                            {activity.event.startsWith('server:sftp.') && (
                                // <Tooltip placement={'top'} content={'Using SFTP'}>
                                // <FolderOpenIcon />
                                <div>folder open icon</div>
                                // </Tooltip>
                            )}
                            {children}
                        </div>
                    </div>
                    {/* We really don't need an i18n lib to translate what the activity log does */}
                    {/* <p className={style.description}>
                        <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                    </p> */}
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
