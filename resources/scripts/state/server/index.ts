import { createContext } from 'react';

import type { Server } from '@/api/server/getServer';

export type ServerStatus = 'offline' | 'starting' | 'stopping' | 'running' | null;

export const ServerContext = createContext<Server | null>(null);
