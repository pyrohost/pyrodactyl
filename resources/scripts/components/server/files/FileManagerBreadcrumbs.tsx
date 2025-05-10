import { encodePathSegments } from '@/helpers';
import { Fragment, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';

import { ServerContext } from '@/state/server';

interface Props {
    renderLeft?: JSX.Element;
    withinFileEditor?: boolean;
    isNewFile?: boolean;
}

export default ({ renderLeft, withinFileEditor, isNewFile }: Props) => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const params = useParams<'*'>();

    const [file, setFile] = useState<string>();

    useEffect(() => {
        if (!withinFileEditor || isNewFile) {
            return;
        }

        if (withinFileEditor && params['*'] !== undefined && !isNewFile) {
            setFile(decodeURIComponent(params['*']).split('/').pop());
        }
    }, [withinFileEditor, isNewFile]);

    const breadcrumbs = (): { name: string; path?: string }[] => {
        if (directory === '.') {
            return [];
        }

        return directory
            .split('/')
            .filter((directory) => !!directory)
            .map((directory, index, dirs) => {
                if (!withinFileEditor && index === dirs.length - 1) {
                    return { name: directory };
                }

                return { name: directory, path: `/${dirs.slice(0, index + 1).join('/')}` };
            });
    };

    return (
        <div className={`group select-none flex grow-0 items-center text-sm overflow-x-hidden`}>
            {renderLeft || <div className={`w-12`} />}
            <NavLink to={`/server/${id}/files`} className={`px-1 text-zinc-200 no-underline hover:text-zinc-100`}>
                root
            </NavLink>
            <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-3 h-3'
            >
                <path strokeLinecap='round' strokeLinejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' />
            </svg>
            {breadcrumbs().map((crumb, index) =>
                crumb.path ? (
                    <Fragment key={index}>
                        <NavLink
                            to={`/server/${id}/files#${encodePathSegments(crumb.path)}`}
                            className={`px-1 text-zinc-200 no-underline hover:text-zinc-100`}
                        >
                            {crumb.name}
                        </NavLink>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='w-3 h-3'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' />
                        </svg>
                    </Fragment>
                ) : (
                    <span key={index} className={`px-1 text-zinc-300`}>
                        {crumb.name}
                    </span>
                ),
            )}
            {file && (
                <Fragment>
                    <span className={`px-1 text-zinc-300`}>{file}</span>
                </Fragment>
            )}
        </div>
    );
};
