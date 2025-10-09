import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const PIDLimitModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = [
            'pthread_create failed',
            'failed to create thread',
            'unable to create thread',
            'unable to create native thread',
            'unable to create new native thread',
            'exception in thread "craft async scheduler management thread"',
        ];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:pidLimit');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title={isAdmin ? 'Se ha alcanzado el límite del proceso o el tope de la memoria' : 'Se ha alcanzado el límite de recursos'}
        >
            <FlashMessageRender key={'feature:pidLimit'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>
                            This server has reached the maximum process, thread, or memory limit. Increasing{' '}
                            <code className={`font-mono bg-zinc-900`}>container_pid_limit</code> in the Wings
                            configuration, <code className={`font-mono bg-zinc-900`}>config.yml</code>, might help
                            resolve this issue.
                        </p>
                        <p className='mt-3'>
                            <b>Note: Wings must be restarted for the configuration file changes to take effect</b>
                        </p>
                    </>
                ) : (
                    <>
                        <p>
                            Este servidor está intentando usar más recursos de los que tiene disponibles. Por favor,
                            contacta con el soporte técnico indicando el siguiente código:
                        </p>
                        <p className='mt-3'>
                            <code className={`font-mono bg-zinc-900`}>
                                pthread_create failed, Possibly out of memory or process/resource limits reached
                            </code>
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PIDLimitModalFeature;
