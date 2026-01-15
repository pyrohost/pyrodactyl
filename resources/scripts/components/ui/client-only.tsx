'use client';

import { type ReactNode, useEffect, useState } from 'react';

const ClientOnly = ({ children }: { children: ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <>{children}</>;
};

export default ClientOnly;
