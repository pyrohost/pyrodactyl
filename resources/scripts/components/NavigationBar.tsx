import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
// FIXME: replace with radix tooltip
// this file actually isnt used so i dont need to actually
// import Tooltip from '@/components/elements/tooltip/Tooltip';

const RightNavigation = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-full no-underline text-zinc-300 px-6 cursor-pointer transition-all duration-150`};

        &:active,
        &:hover {
            ${tw`text-zinc-100 bg-black`};
        }

        &:active,
        &:hover,
        &.active {
            box-shadow: inset 0 -2px;
        }
    }
`;

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <header
            data-pyro-sidebar=''
            className={'w-[320px] flex shrink-0 bg-zinc-900 shadow-md overflow-x-auto rounded-xl'}
        >
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] max-w-[1200px]'}>
                <div id={'logo'} className={'flex-1'}>
                    <Link
                        to={'/'}
                        className={
                            'text-2xl  px-4 no-underline text-zinc-200 hover:text-zinc-100 transition-colors duration-150'
                        }
                    >
                        {name}
                    </Link>
                </div>
                <RightNavigation className={'flex h-full items-center justify-center'}>
                    <SearchContainer />
                    {/* <Tooltip placement={'bottom'} content={'Dashboard'}> */}
                    <NavLink to={'/'} exact>
                        {/* <FontAwesomeIcon icon={faLayerGroup} /> */}
                    </NavLink>
                    {/* </Tooltip> */}
                    {rootAdmin && (
                        // <Tooltip placement={'bottom'} content={'Admin'}>
                        <a href={'/admin'} rel={'noreferrer'}>
                            {/* <FontAwesomeIcon icon={faCogs} /> */}
                        </a>
                        // </Tooltip>
                    )}
                    {/* <Tooltip placement={'bottom'} content={'Account Settings'}>
                        <NavLink to={'/account'}>
                            <span className={'flex items-center w-5 h-5'}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip> */}
                    {/* <Tooltip placement={'bottom'} content={'Sign Out'}> */}
                    <button onClick={onTriggerLogout}>
                        {/* <FontAwesomeIcon icon={faSignOutAlt} /> */}
                    </button>
                    {/* </Tooltip> */}
                </RightNavigation>
            </div>
        </header>
    );
};
