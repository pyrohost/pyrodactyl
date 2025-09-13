import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const SteamDiskSpaceFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['steamcmd needs 250mb of free disk space to update', '0x202 after update job'];

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
        clearFlashes('feature:steamDiskSpace');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title='Out of available disk space'
        >
            <FlashMessageRender key={'feature:steamDiskSpace'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>
                            This server has run out of available disk space and cannot complete the install or update
                            process.
                        </p>
                        <p className='mt-3'>
                            Ensure the machine has enough disk space by typing{' '}
                            <code className={`font-mono bg-zinc-900 rounded-sm py-1 px-2`}>df -h</code> on the machine
                            hosting this server. Delete files or increase the available disk space to resolve the issue.
                        </p>
                    </>
                ) : (
                    <>
                        <p className={`mt-4`}>
                            This server has run out of available disk space and cannot complete the install or update
                            process. Please get in touch with the administrator(s) and inform them of disk space issues.
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SteamDiskSpaceFeature;
