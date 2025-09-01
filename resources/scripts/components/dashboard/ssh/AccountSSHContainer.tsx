import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';
import Code from '@/components/elements/Code';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import { useSSHKeys } from '@/api/account/ssh-keys';

import { useFlashKey } from '@/plugins/useFlash';

const AccountSSHContainer = () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const doDeletion = (fingerprint: string) => {};

    return (
        <PageContentBlock title={'Claves SSH'}>
            <FlashMessageRender byKey={'account'} />
            <div className='md:flex flex-nowrap my-10 space-x-8'>
                {/* Create SSH Key Section */}
                <ContentBox title={'Agregar clave SSH'} className='flex-none w-full md:w-1/1'>
                    <CreateSSHKeyForm />
                </ContentBox>
            </div>
            {/* SSH Keys List Section */}
            <ContentBox title={'Claves SSH'}>
                <SpinnerOverlay visible={!data && isValidating} />
                <Dialog.Confirm
                    title={'Eliminar clave SSH'}
                    confirm={'Eliminar la clave'}
                    open={!!deleteIdentifier}
                    onClose={() => setDeleteIdentifier('')}
                    onConfirmed={() => doDeletion(deleteIdentifier)}
                >
                    Eliminar esta clave revocará el acceso a cualquier aplicación que la esté utilizando.
                </Dialog.Confirm>
                {!data || data.length === 0 ? (
                    <p className='text-center text-sm text-gray-500'>
                        {!data ? 'Cargando...' : 'No existe ninguna clave SSH para esta cuenta.'}
                    </p>
                ) : (
                    data.map((key) => (
                        <div key={key.fingerprint} className='flex flex-col mb-6 space-y-4'>
                            <div className='flex items-center justify-between space-x-4 border border-gray-300 rounded-lg p-4 transition duration-200'>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium'>{key.name}</p>
                                    <p className='text-xs text-gray-500 uppercase'>
                                        Creada el: {format(key.createdAt, 'd MMM, yyyy HH:mm')}
                                    </p>
                                </div>
                                <p className='text-sm text-gray-600 hidden md:block'>
                                    <code className='font-mono py-1 px-2 bg-gray-800 rounded-sm text-white'>
                                        SHA256: {key.fingerprint}
                                    </code>
                                </p>
                                <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                            </div>
                        </div>
                    ))
                )}
            </ContentBox>
        </PageContentBlock>
    );
};

export default AccountSSHContainer;
