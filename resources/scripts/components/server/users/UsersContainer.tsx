import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import HugeIconsPlus from '@/components/elements/hugeicons/Plus';
import HugeIconsUser from '@/components/elements/hugeicons/User';
import { PageListContainer } from '@/components/elements/pages/PageList';
import UserRow from '@/components/server/users/UserRow';

import { httpErrorToHuman } from '@/api/http';
import getServerSubusers from '@/api/server/users/getServerSubusers';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const UsersContainer = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, []);

    useEffect(() => {
        getPermissions().catch((error) => {
            addError({ key: 'users', message: httpErrorToHuman(error) });
            console.error(error);
        });
    }, []);

    if (!subusers.length && (loading || !Object.keys(permissions).length)) {
        return (
            <ServerContentBlock title={'Users'}>
                <FlashMessageRender byKey={'users'} />
                <MainPageHeader
                    direction='column'
                    title={'Users'}
                    titleChildren={
                        <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                            <p className='text-sm text-zinc-300 text-center sm:text-right'>0 users</p>
                            <Can action={'user.create'}>
                                <ActionButton
                                    variant='primary'
                                    onClick={() => navigate(`/server/${serverId}/users/new`)}
                                    className='flex items-center gap-2'
                                >
                                    <HugeIconsPlus className='w-4 h-4' fill='currentColor' />
                                    New User
                                </ActionButton>
                            </Can>
                        </div>
                    }
                >
                    <p className='text-sm text-neutral-400 leading-relaxed'>
                        Manage user access to your server. Grant specific permissions to other users to help you manage
                        and maintain your server.
                    </p>
                </MainPageHeader>
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Users'}>
            <FlashMessageRender byKey={'users'} />
            <MainPageHeader
                direction='column'
                title={'Users'}
                titleChildren={
                    <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                        <p className='text-sm text-zinc-300 text-center sm:text-right'>{subusers.length} users</p>
                        <Can action={'user.create'}>
                            <ActionButton
                                variant='primary'
                                onClick={() => navigate(`/server/${serverId}/users/new`)}
                                className='flex items-center gap-2'
                            >
                                <HugeIconsPlus className='w-4 h-4' fill='currentColor' />
                                New User
                            </ActionButton>
                        </Can>
                    </div>
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Manage user access to your server. Grant specific permissions to other users to help you manage and
                    maintain your server.
                </p>
            </MainPageHeader>
            {!subusers.length ? (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <HugeIconsUser className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>No users found</h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            Your server does not have any additional users. Add others to help you manage your server.
                        </p>
                    </div>
                </div>
            ) : (
                <PageListContainer data-pyro-users-container-users>
                    <For each={subusers} memo>
                        {(subuser) => <UserRow key={subuser.uuid} subuser={subuser} />}
                    </For>
                </PageListContainer>
            )}
        </ServerContentBlock>
    );
};

export default UsersContainer;
