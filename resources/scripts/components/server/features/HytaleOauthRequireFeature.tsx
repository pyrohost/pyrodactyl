import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Button from '@/components/elements/ActionButton';
// assuming this is your styled button
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const HytaleOauthRequireFeature = () => {
    const [visible, setVisible] = useState(false);
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const listener = (line: string) => {
            const urlMatch = line.match(
                /https:\/\/oauth\.accounts\.hytale\.com\/oauth2\/device\/verify\?user_code=([a-zA-Z0-9\s]+)/i,
            );
            if (urlMatch) {
                const code = urlMatch[1]?.trim() || '';
                setUserCode(code);
                setVerificationUri(urlMatch[0] || '');
                setVisible(true);
                return;
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);
        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:hytaleOauth');
    }, []);

    const handleAuthenticate = () => {
        if (verificationUri) {
            window.open(verificationUri, '_blank', 'noopener,noreferrer');
            setVisible(false);
        }
    };

    return (
        <Modal
            visible={visible}
            onDismissed={() => {
                setVisible(false);
                setUserCode('');
                setVerificationUri('');
            }}
            closeOnBackground={false}
            showSpinnerOverlay={false}
            title='Hytale Authentication'
        >
            <FlashMessageRender key='feature:hytaleOauth' />
            <div>
                <div className='text-center text-zinc-300 mb-6'>
                    <p className='mb-4 text-md'>
                        Server requires authentication to start. Click below to verify this device.
                    </p>
                </div>

                <Button
                    variant='primary'
                    onClick={handleAuthenticate}
                    className='w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded mb-6 flex items-center justify-center gap-2'
                >
                    Authenticate Server
                </Button>
                <div className='relative my-6'>
                    <div className='absolute inset-0 flex items-center'>
                        <div className='w-full h-px bg-[#ffffff33]'></div>
                    </div>

                    <div className='relative flex justify-center text-zinc-400 uppercase text-sm tracking-wider'>
                        <span className='bg-zinc-900 px-5'>OR ENTER CODE MANUALLY</span>
                    </div>
                </div>

                <div className='bg-zinc-900 border border-zinc-700 rounded p-4 text-center'>
                    <div className='text-zinc-400 text-sm mb-2'>DEVICE CODE</div>
                    {userCode ? (
                        <div
                            className='text-3xl font-mono text-white tracking-wider mb-2 cursor-pointer hover:text-zinc-300 transition-colors'
                            onClick={() => navigator.clipboard.writeText(userCode)}
                        >
                            {userCode}
                        </div>
                    ) : (
                        <div className='text-3xl font-mono text-white tracking-wider mb-2'>•••• ••••</div>
                    )}
                </div>

                <p className='text-zinc-500 text-xs text-center mt-4'>Only required once per server</p>
            </div>
        </Modal>
    );
};

export default HytaleOauthRequireFeature;
