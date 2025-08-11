import { NavLink } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';

const NewFileButton = ({ id }: { id: string }) => {
    return (
        <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
            <ActionButton variant='secondary' size='md'>
                New File
            </ActionButton>
        </NavLink>
    );
};

export default NewFileButton;
