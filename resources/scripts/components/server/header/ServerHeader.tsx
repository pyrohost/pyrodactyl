import HeaderCentered from '@/components/dashboard/header/HeaderCentered';

import { useEffect } from 'react';
import { useHeader } from '@/contexts/HeaderContext';
import { ServerContext } from '@/state/server';
import { useMemo } from 'react';
import ServerDetailsHeader from './ServerDetailsHeader';
import { StatusPillHeader } from './StatusPillHeader';
import PowerButtons from './PowerButtons';

interface headerProps {
    powerButtons?: boolean;
}

const ServerHeader = (props: headerProps) => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const { setHeaderActions, clearHeaderActions } = useHeader();

    const buttonsSection = useMemo(
        () => (
            <PowerButtons className={`flex gap-2 items-center justify-center ${props.powerButtons ? '' : 'hidden'}`} />
        ),
        [props.powerButtons],
    );

    const statusSection = useMemo(
        () => (
            <HeaderCentered className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                    <StatusPillHeader />
                    <span className='xl:max-w-[20vw] min-w-0 truncate'>{name}</span>
                </div>

                <div className='border-l border-gray-200 h-6' />
                <ServerDetailsHeader />
            </HeaderCentered>
        ),
        [name],
    );

    useEffect(() => {
        setHeaderActions([statusSection, buttonsSection]);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions, statusSection, buttonsSection]);

    return null;
};

export default ServerHeader;
