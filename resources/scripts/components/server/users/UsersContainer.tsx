import { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import AddSubuserButton from '@/components/server/users/AddSubuserButton';
import UserRow from '@/components/server/users/UserRow';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { httpErrorToHuman } from '@/api/http';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { For } from 'million/react';
import { MainPageHeader } from '@/components/elements/MainPageHeader';

export default () => {
    const [loading, setLoading] = useState(true);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
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
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Users</h1>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Users'}>
            <FlashMessageRender byKey={'users'} />
            <MainPageHeader title={'Users'}>
                <Can action={'user.create'}>
                    <AddSubuserButton />
                </Can>
            </MainPageHeader>
            {!subusers.length ? (
                <p className={`text-center text-sm text-zinc-300`}>It looks like you don&apos;t have any subusers.</p>
            ) : (
                <div
                    data-pyro-users-container-users
                    style={{
                        background:
                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                    }}
                    className='p-1 border-[1px] border-[#ffffff12] rounded-xl'
                >
                    <div className='w-full h-full overflow-hidden rounded-lg flex flex-col gap-1'>
                        {/* {subusers.map((subuser) => (
                            <UserRow key={subuser.uuid} subuser={subuser} />
                        ))} */}
                        <For each={subusers} memo>
                            {(subuser) => <UserRow key={subuser.uuid} subuser={subuser} />}
                        </For>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};
