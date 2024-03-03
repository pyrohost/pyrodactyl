import { useContext, useEffect } from 'react';
// FIXME: add icons back
import clsx from 'clsx';
import { DialogContext, DialogIconProps, styles } from './';

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
                {/* <Icon className={'w-6 h-6'} /> */}
                <div>FIXME: Icons</div>
            </div>
        );
    }, [type, className]);

    useEffect(() => {
        setIconPosition(position);
    }, [position]);

    return null;
};
