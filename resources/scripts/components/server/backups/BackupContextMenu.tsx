import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsAlert from '@/components/elements/hugeicons/Alert';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import HugeIconsHamburger from '@/components/elements/hugeicons/hamburger';

import http, { httpErrorToHuman } from '@/api/http';
import {
    getServerBackupDownloadUrl,
} from '@/api/server/backups';
import { ServerBackup } from '@/api/server/types';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';
import { useUnifiedBackups } from './useUnifiedBackups';

interface Props {
    backup: ServerBackup;
}

const BackupContextMenu = ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [newName, setNewName] = useState(backup.name);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { deleteBackup, restoreBackup, renameBackup, toggleBackupLock, refresh } = useUnifiedBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getServerBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await deleteBackup(backup.uuid);
            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };
    const doRestorationAction = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await restoreBackup(backup.uuid);

            // Set server status to restoring
            setServerFromState((s) => ({
                ...s,
                status: 'restoring_backup',
            }));

            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };

    const onLockToggle = async () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        try {
            await toggleBackupLock(backup.uuid);
            setModal('');
        } catch (error) {
            alert(httpErrorToHuman(error));
        }
    };

    const doRename = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await renameBackup(backup.uuid, newName.trim());
            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (modal === 'restore' && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modal, countdown]);

    useEffect(() => {
        if (modal === 'restore') {
            setCountdown(5);
        }
    }, [modal]);

    useEffect(() => {
        if (modal === 'rename') {
            setNewName(backup.name);
        }
    }, [modal, backup.name]);

    return (
        <>
            <Dialog open={modal === 'rename'} onClose={() => setModal('')} title='Renombrar copia'>
                <div className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-zinc-200 mb-2'>Nombre de la copia</label>
                        <input
                            type='text'
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            placeholder='Introduce el nombre de la copia...'
                            maxLength={191}
                        />
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setModal('')} variant='secondary'>
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        onClick={doRename}
                        variant='primary'
                        disabled={!newName.trim() || newName.trim() === backup.name}
                    >
                        Renombrar copia
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={`Desbloquear "${backup.name}"`}
                onConfirmed={onLockToggle}
            >
                Esta copia ya no estará protegida de eliminaciones automáticas o accidentales.
            </Dialog.Confirm>
            <Dialog open={modal === 'restore'} onClose={() => setModal('')} title='Restaurar desde copia'>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <p className='text-sm font-medium text-zinc-200'>&quot;{backup.name}&quot;</p>
                        <p className='text-sm text-zinc-400'>
                            Tu servidor se detendrá. No podrás controlar el estado, acceder al administrador de archivos o
                            crear nuevas copias hasta que se complete el proceso.
                        </p>
                    </div>

                    <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                        <div className='flex items-start space-x-3'>
                            <HugeIconsAlert fill='currentColor' className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
                            <div className='space-y-1'>
                                <h4 className='text-sm text-red-200 font-medium'>
                                    Acción destructiva - Restauración completa
                                    Destructive Action - Complete Server Restore
                                </h4>
                                <p className='text-xs text-red-300'>
                                    Todos los archivos y configuraciones actuales se eliminarán y remplazarán con
                                    los datos de la copia. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setModal('')} variant='secondary'>
                        Cancelar
                    </ActionButton>
                    <ActionButton onClick={() => doRestorationAction()} variant='danger' disabled={countdown > 0}>
                        {countdown > 0 ? `Borrar todo y restaurar (${countdown}s)` : 'Borrar todo y restaurar'}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <Dialog.Confirm
                title={`Eliminar "${backup.name}"`}
                confirm={'Continuar'}
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
            >
                Esto es una operación irreversible. La copia no se podrá recuperar nunca más una vez se elimine.
            </Dialog.Confirm>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            disabled={loading}
                            className='flex items-center justify-center w-8 h-8 p-0 hover:bg-zinc-700'
                        >
                            <HugeIconsHamburger className='h-4 w-4' fill='currentColor' />
                        </ActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                        <Can action={'backup.download'}>
                            <DropdownMenuItem onClick={doDownload} className='cursor-pointer'>
                                <HugeIconsFileDownload className='h-4 w-4 mr-2' fill='currentColor' />
                                Descargar
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownMenuItem onClick={() => setModal('restore')} className='cursor-pointer'>
                                <HugeIconsCloudUp className='h-4 w-4 mr-2' fill='currentColor' />
                                Restaurar
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.delete'}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setModal('rename')} className='cursor-pointer'>
                                <HugeIconsPencil className='h-4 w-4 mr-2' fill='currentColor' />
                                Renombrar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onLockToggle} className='cursor-pointer'>
                                <HugeIconsFileSecurity className='h-4 w-4 mr-2' fill='currentColor' />
                                {backup.isLocked ? 'Desbloquear' : 'Bloquear'}
                            </DropdownMenuItem>
                            {!backup.isLocked && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setModal('delete')}
                                        className='cursor-pointer text-red-400 focus:text-red-300'
                                    >
                                        <HugeIconsDelete className='h-4 w-4 mr-2' fill='currentColor' />
                                        Eliminar
                                    </DropdownMenuItem>
                                </>
                            )}
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <ActionButton
                    variant='danger'
                    size='sm'
                    onClick={() => setModal('delete')}
                    disabled={loading}
                    className='flex items-center gap-2'
                >
                    <HugeIconsDelete className='h-4 w-4' fill='currentColor' />
                    <span className='hidden sm:inline'>Eliminar</span>
                </ActionButton>
            )}
        </>
    );
};

export default BackupContextMenu;
