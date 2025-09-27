import { useEffect, useRef } from 'react';

import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

const useWebsocketEvent = (event: SocketEvent, callback: (data: any) => void) => {
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const savedCallback = useRef<any>(null);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    return useEffect(() => {
        const eventListener = (data: any) => savedCallback.current(data);
        if (connected && instance) {
            instance.addListener(event, eventListener);
        }

        return () => {
            if (instance) instance.removeListener(event, eventListener);
        };
    }, [event, connected, instance]);
};

export default useWebsocketEvent;
