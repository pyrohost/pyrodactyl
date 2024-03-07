import { useState } from 'react';
import { Subuser } from '@/state/server/subusers';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import Can from '@/components/elements/Can';
import { useStoreState } from 'easy-peasy';
import GreyRowBox from '@/components/elements/GreyRowBox';

interface Props {
    subuser: Subuser;
}

export default ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const [visible, setVisible] = useState(false);

    return (
        <GreyRowBox>
            <EditSubuserModal subuser={subuser} visible={visible} onModalDismissed={() => setVisible(false)} />
            <div className={`w-10 h-10 rounded-full bg-white border-2 border-zinc-800 overflow-hidden hidden md:block`}>
                <img className={`w-full h-full`} src={`${subuser.image}?s=400`} />
            </div>
            <div className={`ml-4 flex-1 overflow-hidden`}>
                <p className={`text-sm truncate`}>{subuser.email}</p>
            </div>
            <div className={`ml-4`}>
                <p className={`font-medium text-center`}>
                    &nbsp;
                    {/* <FontAwesomeIcon
                        icon={subuser.twoFactorEnabled ? faUserLock : faUnlockAlt}
                        fixedWidth
                        css={!subuser.twoFactorEnabled ? tw`text-red-400` : undefined}
                    /> */}
                    {subuser.twoFactorEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                    &nbsp;
                </p>
                <p className={`text-xs text-zinc-500 uppercase hidden md:block`}>2FA Enabled</p>
            </div>
            <div className={`ml-4 hidden md:block`}>
                <p className={`font-medium text-center`}>
                    {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length}
                </p>
                <p className={`text-xs text-zinc-500 uppercase`}>Permissions</p>
            </div>
            {subuser.uuid !== uuid && (
                <>
                    <Can action={'user.update'}>
                        <button
                            type={'button'}
                            aria-label={'Edit subuser'}
                            className={`block text-sm p-1 md:p-2 text-zinc-500 hover:text-zinc-100 transition-colors duration-150 mx-4`}
                            onClick={() => setVisible(true)}
                        >
                            {/* <FontAwesomeIcon icon={faPencilAlt} /> */}
                            FIXME: Edit User
                        </button>
                    </Can>
                    <Can action={'user.delete'}>
                        <RemoveSubuserButton subuser={subuser} />
                    </Can>
                </>
            )}
        </GreyRowBox>
    );
};
