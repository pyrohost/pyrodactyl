import { useField } from 'formik';
import { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';

import Input from '@/components/elements/Input';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface Props {
    isEditable?: boolean;
    title: string;
    permissions: string[];
    className?: string;
    children: React.ReactNode;
}

const PermissionTitleBox: React.FC<Props> = memo(({ isEditable, title, permissions, className, children }) => {
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value],
    );

    return (
        <TitledGreyBox
            title={
                <div className={`flex items-center justify-between w-full`}>
                    <p className={`text-sm capitalize`}>{title}</p>
                    {isEditable && (
                        <Input
                            type={'checkbox'}
                            checked={permissions.every((p) => value.includes(p))}
                            onChange={onCheckboxClicked}
                        />
                    )}
                </div>
            }
            className={className}
        >
            {children}
        </TitledGreyBox>
    );
}, isEqual);

PermissionTitleBox.displayName = 'PermissionTitleBox';

export default PermissionTitleBox;
