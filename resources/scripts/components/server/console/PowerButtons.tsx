import React, { useEffect, useState } from 'react';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import { toast } from 'sonner';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            if (action === 'start') {
                toast.success('Your server is starting!');
            } else if (action === 'restart') {
                toast.success('Your server is restarting.');
            } else {
                toast.success('Your server is being stopped.');
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <button
                    style={{
                        background: 'radial-gradient(109.26% 109.26% at 49.83% 13.37%, #FF343C 0%, #F06F53 100%)',
                    }}
                    className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-l-full rounded-r-md text-sm font-bold shadow-md'
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                >
                    Start
                </button>
            </Can>
            <Can action={'control.restart'}>
                <button
                    style={{
                        background:
                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                    }}
                    className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-none text-sm font-bold shadow-md'
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                >
                    Restart
                </button>
            </Can>
            <Can action={'control.stop'}>
                <button
                    style={{
                        background:
                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                    }}
                    className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-r-full rounded-l-md text-sm font-bold shadow-md'
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    {killable ? 'Kill' : 'Stop'}
                </button>
            </Can>
        </div>
    );
};
