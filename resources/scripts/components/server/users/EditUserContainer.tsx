import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import HugeIconsArrowLeft from '@/components/elements/hugeicons/ArrowLeft';
import HugeIconsUser from '@/components/elements/hugeicons/User';
import UserFormComponent from '@/components/server/users/UserFormComponent';

import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

const EditUserContainer = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);

    // Find the subuser by UUID
    const subuser = subusers.find((s: Subuser) => s.uuid === id);

    useEffect(() => {
        // If subuser not found, redirect back to users list
        if (!subuser && subusers.length > 0) {
            navigate(`/server/${serverId}/users`);
        }
    }, [subuser, subusers, navigate, serverId]);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    // Show loading state while we're waiting for subusers to load
    if (!subuser && subusers.length === 0) {
        return (
            <ServerContentBlock title={'Edit User'}>
                <MainPageHeader title={'Edit User'}>
                    <ActionButton
                        variant='secondary'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        className='flex items-center gap-2'
                    >
                        <HugeIconsArrowLeft className='w-4 h-4' fill='currentColor' />
                        Back to Users
                    </ActionButton>
                </MainPageHeader>
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </ServerContentBlock>
        );
    }

    // If subuser not found after loading, show not found message
    if (!subuser) {
        return (
            <ServerContentBlock title={'Edit User'}>
                <MainPageHeader title={'Edit User'}>
                    <ActionButton
                        variant='secondary'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        className='flex items-center gap-2'
                    >
                        <HugeIconsArrowLeft className='w-4 h-4' fill='currentColor' />
                        Back to Users
                    </ActionButton>
                </MainPageHeader>
                <div className='flex flex-col items-center justify-center py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <HugeIconsUser className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>User not found</h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            The user you&apos;re trying to edit could not be found.
                        </p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Edit User'}>
            <MainPageHeader title={`Edit User: ${subuser.email}`}>
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
                subuser={subuser}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                flashKey='user:edit'
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
            />
        </ServerContentBlock>
    );
};

export default EditUserContainer;
