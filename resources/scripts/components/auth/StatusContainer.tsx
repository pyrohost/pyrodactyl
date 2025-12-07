import {
    Alert02Icon,
    CancelCircleIcon,
    CheckmarkCircle02Icon,
    InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import { Fragment } from 'react';

import { FlashMessageType } from '@/components/MessageBox';

import { cn } from '@/lib/utils';

type Props = Readonly<{
    byKey?: string;
}>;

const StatusContainer = ({ text, type }: { text: string; type?: FlashMessageType }) => {
    const getIcon = () => {
        switch (type) {
            case 'error':
                return <HugeiconsIcon icon={CancelCircleIcon} className='size-5' />;
            case 'warning':
                return <HugeiconsIcon icon={Alert02Icon} className='size-5' />;
            case 'success':
                return <HugeiconsIcon icon={CheckmarkCircle02Icon} className='size-5' />;
            case 'info':
                return <HugeiconsIcon icon={InformationCircleIcon} className='size-5' />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-2',
                type === 'error'
                    ? 'text-red-400'
                    : type === 'warning'
                      ? 'text-yellow-400'
                      : type === 'success'
                        ? 'text-green-400'
                        : type === 'info'
                          ? 'text-blue-400'
                          : '',
            )}
            role='alert'
        >
            {getIcon()}
            {text}
        </div>
    );
};
StatusContainer.displayName = 'StatusContainer';

const FlashStatusContainer = ({ byKey }: Props) => {
    const flashes = useStoreState((state) =>
        state.flashes.items.filter((flash) => (byKey ? flash.key === byKey : true)),
    );

    return flashes.length ? (
        <>
            {flashes.map((flash, index) => (
                <Fragment key={flash.id || flash.type + flash.message}>
                    {index > 0 && <></>}
                    <StatusContainer type={flash.type} text={flash.message}></StatusContainer>
                </Fragment>
            ))}
        </>
    ) : null;
};

export default FlashStatusContainer;

