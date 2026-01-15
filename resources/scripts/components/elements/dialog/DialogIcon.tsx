import { Shield } from '@gravity-ui/icons';
import clsx from 'clsx';
import { useContext, useEffect } from 'react';

import { DialogContext, type DialogIconProps, styles } from './';

// const icons = {
//     danger: ShieldExclamationIcon,
//     warning: ExclamationIcon,
//     success: CheckIcon,
//     info: InformationCircleIcon,
// };

export default ({ type, position, className }: DialogIconProps) => {
    const { setIcon, setIconPosition } = useContext(DialogContext);

    useEffect(() => {
        // const Icon = icons[type];

        setIcon(
            <div className={clsx(styles.dialog_icon, styles[type], className)}>
                <Shield width={22} height={22} fill='currentColor' />
            </div>,
        );
    }, [type, className]);

    useEffect(() => {
        setIconPosition(position);
    }, [position]);

    return null;
};
