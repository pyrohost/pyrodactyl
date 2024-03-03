import clsx from 'clsx';
import styles from '@/components/elements/dropdown/style.module.css';
// FIXME: add icons back
import { Menu } from '@headlessui/react';

interface Props {
    className?: string;
    animate?: boolean;
    children: React.ReactNode;
}

export default ({ className, children }: Props) => (
    <Menu.Button className={clsx(styles.button, className || 'px-4')}>
        {typeof children === 'string' ? (
            <>
                <span className={'mr-2'}>{children}</span>
                {/* <ChevronDownIcon aria-hidden={'true'} data-animated={animate.toString()} /> */}
            </>
        ) : (
            children
        )}
    </Menu.Button>
);
