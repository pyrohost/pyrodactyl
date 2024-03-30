import { useStoreState } from 'easy-peasy';

import Checkbox from '@/components/elements/Checkbox';
import Label from '@/components/elements/Label';

interface Props {
    permission: string;
    disabled: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key = '', pkey = ''] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <label htmlFor={`permission_${permission}`} className={disabled ? 'disabled' : undefined}>
            <div className={`flex flex-col`}>
                <div className='flex flex-row items-center'>
                    <Checkbox
                        id={`permission_${permission}`}
                        name={'permissions'}
                        value={permission}
                        className={`w-4 h-4 mr-2`}
                        disabled={disabled}
                    />
                    <Label as={'p'} className={`font-medium`}>
                        {pkey}
                    </Label>
                </div>
                <div className={`flex-1`}>
                    {(permissions[key]?.keys?.[pkey]?.length ?? 0) > 0 && (
                        <p className={`text-xs text-neutral-400 mt-1`}>{permissions[key]?.keys?.[pkey] ?? ''}</p>
                    )}
                </div>
            </div>
        </label>
    );
};

export default PermissionRow;
