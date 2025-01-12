import React, { useEffect } from 'react';
import { ServerContext } from '@/state/server';

interface ServerProviderProps {
    serverId?: string;
    children: React.ReactNode;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({ serverId, children }) => {
    const store = ServerContext.useStore();

    useEffect(() => {
        if (serverId) {
            store.getActions().server.getServer(serverId);
        }
    }, [serverId]);

    return (
        <ServerContext.Provider store={store}>
            {children}
        </ServerContext.Provider>
    );
};