import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface StatusOverride {
    text: string;
    color: string;
}

interface StatusPillContextType {
    override: StatusOverride | null;
    setStatusOverride: (text: string, color: string, duration?: string) => void;
}

const StatusPillContext = createContext<StatusPillContextType | undefined>(undefined);

class StatusManager {
    private static instance: StatusManager;
    private setOverrideCallback?: (text: string, color: string, duration: string) => void;

    static getInstance() {
        if (!this.instance) {
            this.instance = new StatusManager();
        }
        return this.instance;
    }

    setCallback(callback: (text: string, color: string, duration: string) => void) {
        this.setOverrideCallback = callback;
    }

    setStatus(text: string, color: string, duration: string = '5') {
        if (!this.setOverrideCallback) {
            console.error('Status manager not initialized');
            return;
        }
        this.setOverrideCallback(text, color, duration);
    }
}

export const statusManager = StatusManager.getInstance();

export const StatusPillProvider = ({ children }: { children: React.ReactNode }) => {
    const [override, setOverride] = useState<StatusOverride | null>(null);
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const setStatusOverride = useCallback((text: string, color: string, duration: string = '5') => {
        if (timer) clearTimeout(timer);
        setOverride({ text, color });
        
        if (duration !== '-') {
            const ms = parseInt(duration) * 1000;
            const newTimer = setTimeout(() => setOverride(null), ms);
            setTimer(newTimer);
        }
    }, [timer]);

    // Register callback with manager
    useEffect(() => {
        statusManager.setCallback(setStatusOverride);
    }, [setStatusOverride]);

    return (
        <StatusPillContext.Provider value={{ override, setStatusOverride }}>
            {children}
        </StatusPillContext.Provider>
    );
};

export const useStatusPillOverride = () => {
    const context = useContext(StatusPillContext);
    if (!context) throw new Error('useStatusPillOverride must be used within StatusPillProvider');
    return { override: context.override, setStatusOverride: context.setStatusOverride };
};