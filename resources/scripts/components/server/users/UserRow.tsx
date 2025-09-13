import { useStoreState } from 'easy-peasy';
import { useNavigate } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import { PageListItem } from '@/components/elements/pages/PageList';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';

import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

interface Props {
    subuser: Subuser;
}

const UserRow = ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const navigate = useNavigate();
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);

    const handleEditClick = () => {
        navigate(`/server/${serverId}/users/${subuser.uuid}/edit`);
    };

    return (
        <PageListItem>
            <div className={`w-10 h-10 rounded-full bg-white border-2 border-zinc-800 overflow-hidden hidden md:block`}>
                <img className={`w-full h-full`} src={`${subuser.image}?s=400`} />
            </div>
            <div className={`sm:ml-4 flex-1 overflow-hidden flex flex-col`}>
                <p className={`truncate text-lg`}>{subuser.email}</p>
                <p className={`mt-1 md:mt-0 text-xs text-zinc-400 truncate sm:text-left text-center`}>
                    {subuser.twoFactorEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                </p>
            </div>

            <div className='flex flex-col items-center md:gap-12 gap-4 sm:flex-row'>
                <div>
                    <p className={`font-medium text-center`}>
                        {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length}
                    </p>
                    <p className={`text-xs text-zinc-500 uppercase`}>Permissions</p>
                </div>
                {subuser.uuid !== uuid && (
                    <>
                        <div className='flex align-middle items-center justify-center gap-2'>
                            <Can action={'user.update'}>
                                <ActionButton
                                    variant='secondary'
                                    size='sm'
                                    className='flex items-center gap-2'
                                    onClick={handleEditClick}
                                    aria-label='Edit subuser'
                                >
                                    <HugeIconsPencil className='w-4 h-4' fill='currentColor' />
                                    Edit
                                </ActionButton>
                            </Can>
                            <Can action={'user.delete'}>
                                <RemoveSubuserButton subuser={subuser} />
                            </Can>
                        </div>
                    </>
                )}
            </div>
        </PageListItem>
    );
};

export default UserRow;
