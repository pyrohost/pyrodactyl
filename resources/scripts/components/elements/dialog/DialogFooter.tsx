import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(<div className={'px-4 py-4 flex items-center justify-end gap-4 rounded-b'}>{children}</div>);
    }, [children]);

    return null;
};
