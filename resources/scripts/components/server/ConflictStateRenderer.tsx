import ScreenBlock from '@/components/elements/ScreenBlock';

import { ServerContext } from '@/state/server';

import Spinner from '../elements/Spinner';

const ConflictStateRenderer = () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false,
    );

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <div className={'flex flex-col items-center justify-center h-full'}>
            <Spinner size={'large'} />
            <div className='flex flex-col mt-4 text-center'>
                <label className='text-neutral-100 text-lg font-bold'>El servidor se está instalando</label>
                <label className='text-neutral-500 text-md font-semibold mt-1'>
                    Tu servidor estará disponible pronto. Puedes ver más detalles en la página de inicio.
                </label>
            </div>
        </div>
    ) : status === 'suspended' ? (
        <ScreenBlock title={'Servidor suspendido'} message={'Este servidor ha sido suspendido y no puede ser accedido.'} />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            title={'Nodo en mantenimiento'}
            message={'El nodo en el que se aloja este servidor se encuentra en mantenimiento.'}
        />
    ) : (
        <ScreenBlock
            title={isTransferring ? 'Transfiriendo' : 'Restaurando'}
            message={
                isTransferring
                    ? 'Tu servidor se está transfiriendo a un nuevo nodo, por favor vuelve más tarde.'
                    : 'Tu servidor se está restaurando desde una copia de seguridad, por favor vuelve más tarde.'
            }
        />
    );
};

export default ConflictStateRenderer;
