import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useStoreState } from 'easy-peasy';
import { useState } from 'react';

import Can from '@/components/elements/Can';
import { PageListItem } from '@/components/elements/pages/PageList';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';

import { Subuser } from '@/state/server/subusers';

interface Props {
    subuser: Subuser;
}

export default ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const [visible, setVisible] = useState(false);

    return (
        <PageListItem>
            <EditSubuserModal subuser={subuser} visible={visible} onModalDismissed={() => setVisible(false)} />
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
                        <div className='flex align-middle items-center justify-center'>
                            <Can action={'user.delete'}>
                                <RemoveSubuserButton subuser={subuser} />
                            </Can>
                            <Can action={'user.update'}>
                                <button
                                    type={'button'}
                                    aria-label={'Edit subuser'}
                                    className={`text-sm p-2 text-zinc-500 hover:text-zinc-100 transition-colors duration-150 flex align-middle items-center justify-center flex-col cursor-pointer`}
                                    onClick={() => setVisible(true)}
                                >
                                    <FontAwesomeIcon icon={faEdit} className={`px-5`} size='lg' />
                                    Edit
                                </button>
                            </Can>
                        </div>
                    </>
                )}
            </div>
        </PageListItem>
    );
};
