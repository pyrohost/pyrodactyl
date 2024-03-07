import styled from 'styled-components';
import Checkbox from '@/components/elements/Checkbox';
import { useStoreState } from 'easy-peasy';
import Label from '@/components/elements/Label';

const Container = styled.label``;

// const Container = styled.label`
//     ${tw`flex items-center border border-transparent rounded md:p-2 transition-colors duration-75`};
//     text-transform: none;

//     &:not(.disabled) {
//         ${tw`cursor-pointer`};

//         &:hover {
//             ${tw`border-zinc-500 bg-zinc-800`};
//         }
//     }

//     &:not(:first-of-type) {
//         ${tw`mt-4 sm:mt-2`};
//     }

//     &.disabled {
//         ${tw`opacity-50`};

//         & input[type='checkbox']:not(:checked) {
//             ${tw`border-0`};
//         }
//     }
// `;

interface Props {
    permission: string;
    disabled: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key = '', pkey = ''] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <Container htmlFor={`permission_${permission}`} className={disabled ? 'disabled' : undefined}>
            <div className={`p-2`}>
                <Checkbox
                    id={`permission_${permission}`}
                    name={'permissions'}
                    value={permission}
                    className={`w-5 h-5 mr-2`}
                    disabled={disabled}
                />
            </div>
            <div className={`flex-1`}>
                <Label as={'p'} className={`font-medium`}>
                    {pkey}
                </Label>
                {(permissions[key]?.keys?.[pkey]?.length ?? 0) > 0 && (
                    <p className={`text-xs text-neutral-400 mt-1`}>{permissions[key]?.keys?.[pkey] ?? ''}</p>
                )}
            </div>
        </Container>
    );
};

export default PermissionRow;
