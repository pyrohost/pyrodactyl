import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import HugeIconsArrowLeft from '@/components/elements/hugeicons/ArrowLeft';
import UserFormComponent from '@/components/server/users/UserFormComponent';

import { ServerContext } from '@/state/server';

const CreateUserContainer = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    return (
        <ServerContentBlock title={'Create User'}>
            <MainPageHeader title={'Create New User'}>
                <ActionButton
                    variant='secondary'
                    onClick={() => navigate(`/server/${serverId}/users`)}
                    className='flex items-center gap-2'
                    disabled={isSubmitting}
                >
                    <HugeIconsArrowLeft className='w-4 h-4' fill='currentColor' />
                    Back to Users
                </ActionButton>
            </MainPageHeader>

            <UserFormComponent
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                flashKey='user:create'
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
            />
        </ServerContentBlock>
    );
};

export default CreateUserContainer;
