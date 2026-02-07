import { useEffect, useMemo } from 'react';
import HeaderCentered from '@/components/dashboard/header/HeaderCentered';
import { useHeader } from '@/contexts/HeaderContext';

interface headerProps {
    title: string;
}

const ServerHeader = (props: headerProps) => {
    const { setHeaderActions, clearHeaderActions } = useHeader();

    const statusSection = useMemo(
        () => (
            <HeaderCentered className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                    <span>{props.title}</span>
                </div>
            </HeaderCentered>
        ),
        [props.title],
    );

    useEffect(() => {
        setHeaderActions([statusSection]);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions, statusSection]);

    return null;
};

export default ServerHeader;
