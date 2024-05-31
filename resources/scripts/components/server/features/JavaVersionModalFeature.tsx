import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Button from '@/components/elements/Button';
import Can from '@/components/elements/Can';
import InputSpinner from '@/components/elements/InputSpinner';
import Modal from '@/components/elements/Modal';
import Select from '@/components/elements/Select';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import HugeIconsArrowDown from '@/components/elements/hugeicons/ArrowDown';
import HugeIconsArrowUp from '@/components/elements/hugeicons/ArrowUp';

import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const MATCH_ERRORS = [
    'minecraft 1.17 requires running the server with java 16 or above',
    'minecraft 1.18 requires running the server with java 17 or above',
    'java.lang.unsupportedclassversionerror',
    'unsupported major.minor version',
    'has been compiled by a more recent version of the java runtime',
];

const JavaVersionModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { instance } = ServerContext.useStoreState((state) => state.socket);

    const { data, isValidating, mutate } = getServerStartup(uuid, undefined, { revalidateOnMount: false });

    useEffect(() => {
        if (!visible) return;

        mutate().then((value) => {
            setSelectedVersion(Object.values(value?.dockerImages || [])[0] || '');
        });
    }, [visible]);

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data) => {
        if (status === 'running') return;

        if (MATCH_ERRORS.some((p) => data.toLowerCase().includes(p.toLowerCase()))) {
            setVisible(true);
        }
    });

    const updateJava = () => {
        setLoading(true);
        clearFlashes('feature:javaVersion');

        setSelectedDockerImage(uuid, selectedVersion)
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }
                setVisible(false);
            })
            .catch((error) => clearAndAddHttpError({ key: 'feature:javaVersion', error }))
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:javaVersion');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            closeOnBackground={false}
            showSpinnerOverlay={loading}
        >
            <div className='flex flex-col gap-4 w-full h-full'>
                {/*<FlashMessageRender key={'feature:javaVersion'} />*/}
                <h2 className={`text-2xl mb-4 text-zinc-100`}>Unsupported Java Version</h2>
                <p className={`mt-4`}>
                    This server is currently running an unsupported version of Java and cannot be started.
                    <Can action={'startup.docker-image'}>
                        &nbsp;Please select a supported version from the list below to continue starting the server.
                    </Can>
                </p>
                <Can action={'startup.docker-image'}>
                    <div className={`mt-4`}>
                        <InputSpinner visible={!data || isValidating}>
                            <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
                                <DropdownMenuTrigger asChild>
                                    <button className='flex items-center justify-center h-8 px-4 text-sm font-medium text-white transition-colors duration-150 bg-gradient-to-b from-[#ffffff10] to-[#ffffff09] inner-border-[1px] inner-border-[#ffffff15] border border-transparent rounded-xl shadow-sm hover:from-[#ffffff05] hover:to-[#ffffff04]' disabled={!data}>
                                        {selectedVersion.split(':').pop()?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Select a version'}
                                        {dropDownOpen ? <HugeIconsArrowUp fill={'currentColor'} className={`ml-2 w-[16px] h-[16px]`} /> : <HugeIconsArrowDown fill={'currentColor'} className={`ml-2 w-[16px] h-[16px]`} />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-[99999]' sideOffset={8}>
                                    <DropdownMenuRadioGroup value={selectedVersion} onValueChange={setSelectedVersion}>
                                    {data && (
                                        Object.keys(data.dockerImages).map((key) => (
                                            <DropdownMenuRadioItem
                                                key={key}
                                                value={data.dockerImages[key] || ''}
                                            >
                                                {key}
                                            </DropdownMenuRadioItem>
                                        ))
                                    )}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </InputSpinner>
                    </div>
                </Can>
                <div className={`mt-8 flex flex-row justify-end gap-4 my-4`}>
                    <Button isSecondary onClick={() => setVisible(false)}>
                        Cancel
                    </Button>
                    <Can action={'startup.docker-image'}>
                        <Button onClick={updateJava} className={`w-full sm:w-auto`}>
                            Update Docker Image
                        </Button>
                    </Can>
                </div>
            </div>
        </Modal>
    );
};

export default JavaVersionModalFeature;
