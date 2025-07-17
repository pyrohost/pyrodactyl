'use client';

import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import { useState } from 'react';

import PyrodactylProvider from '@/components/PyrodactylProvider';

import { Server } from '@/api/server/getServer';

import { StateProvider } from '@/state';
import { ServerContext } from '@/state/server';

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const [serverState] = useState<Server | null>(null);

    return (
        <StateProvider state={{ user: null, permissions: null, flashes: [] }}>
            <GlobalStylesheet />
            <ServerContext.Provider value={serverState}>
                <PyrodactylProvider>{children}</PyrodactylProvider>
            </ServerContext.Provider>
        </StateProvider>
    );
};
