import React, { ReactNode, createContext, useContext, useEffect } from 'react';

import { usePersistedState } from '@/plugins/usePersistedState';

export const SIDEBAR_WIDTH = {
    MINIMIZED: 128,
    REGULAR: 300,
} as const;

interface SidebarContextType {
    isMinimized: boolean;
    toggleMinimized: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isMinimized, setIsMinimized] = usePersistedState('sidebar:minimized', true);

    const toggleMinimized = () => {
        const newValue = !isMinimized;
        setIsMinimized(newValue);
        document.body.setAttribute('data-sidebar-minimized', String(newValue));
    };

    // init data attribute
    useEffect(() => {
        document.body.setAttribute('data-sidebar-minimized', String(isMinimized ?? true));
    }, [isMinimized]);

    return (
        <SidebarContext.Provider value={{ isMinimized: isMinimized ?? true, toggleMinimized }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
