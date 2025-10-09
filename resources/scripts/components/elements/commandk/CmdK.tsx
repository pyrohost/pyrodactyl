import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';

import { ServerContext } from '@/state/server';

import ModrinthLogo from '../ModrinthLogo';
import HugeIconsClock from '../hugeicons/Clock';
import HugeIconsCloudUp from '../hugeicons/CloudUp';
import HugeIconsConnections from '../hugeicons/Connections';
import HugeIconsConsole from '../hugeicons/Console';
import HugeIconsController from '../hugeicons/Controller';
import HugeIconsDashboardSettings from '../hugeicons/DashboardSettings';
import HugeIconsDatabase from '../hugeicons/Database';
import HugeIconsFolder from '../hugeicons/Folder';
import HugeIconsHome from '../hugeicons/Home';
import HugeIconsPencil from '../hugeicons/Pencil';
import HugeIconsPeople from '../hugeicons/People';
import HugeIconsZap from '../hugeicons/Zap';

const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const navigate = useNavigate();
    // controls server power status
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const cmdkPowerAction = (action: string) => {
        if (instance) {
            if (action === 'start') {
                toast.success('Tu servidor se está iniciando...');
            } else if (action === 'restart') {
                toast.success('Tu servidor se está reiniciando...');
            } else {
                toast.success('Tu servidor se está deteniendo...');
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    const cmdkNavigate = (url: string) => {
        navigate('/server/' + id + url);
        setOpen(false);
    };

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Command.Dialog open={open} onOpenChange={setOpen} label='Menú de comandos'>
            <Command.Input />
            <Command.List>
                <Command.Empty>No se han encontrado resultados.</Command.Empty>

                <Command.Group heading='Pages'>
                    <Command.Item onSelect={() => cmdkNavigate('')}>
                        <HugeIconsHome fill='currentColor' />
                        Inicio
                    </Command.Item>
                    <Can action={'file.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/files')}>
                            <HugeIconsFolder fill='currentColor' />
                            Archivos
                        </Command.Item>
                    </Can>
                    <Can action={'database.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/databases')}>
                            <HugeIconsDatabase fill='currentColor' />
                            Bases de datos
                        </Command.Item>
                    </Can>
                    <Can action={'backup.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/backups')}>
                            <HugeIconsCloudUp fill='currentColor' />
                            Copias de seguridad
                        </Command.Item>
                    </Can>
                    <Can action={'allocation.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/network')}>
                            <HugeIconsConnections fill='currentColor' />
                            Red
                        </Command.Item>
                    </Can>
                    <Can action={'user.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/users')}>
                            <HugeIconsPeople fill='currentColor' />
                            Usuarios
                        </Command.Item>
                    </Can>
                    <Can action={['startup.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/startup')}>
                            <HugeIconsConsole fill='currentColor' />
                            Inicio
                        </Command.Item>
                    </Can>
                    <Can action={['schedule.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/schedules')}>
                            <HugeIconsClock fill='currentColor' />
                            Programas
                        </Command.Item>
                    </Can>
                    <Can action={['settings.*', 'file.sftp']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/settings')}>
                            <HugeIconsDashboardSettings fill='currentColor' />
                            Ajustes
                        </Command.Item>
                    </Can>
                    <Can action={['activity.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/activity')}>
                            <HugeIconsPencil fill='currentColor' />
                            Actividad
                        </Command.Item>
                    </Can>
                    <Can action={['modrinth.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/mods')}>
                            <ModrinthLogo />
                            Mods/Plugins
                        </Command.Item>
                    </Can>
                    <Can action={['software.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/shell')}>
                            <HugeIconsController fill='currentColor' />
                            Software
                        </Command.Item>
                    </Can>
                </Command.Group>
                <Command.Group heading='Server'>
                    <Can action={'control.start'}>
                        <Command.Item disabled={status !== 'offline'} onSelect={() => cmdkPowerAction('start')}>
                            <HugeIconsZap fill='currentColor' />
                            Iniciar
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={!status} onSelect={() => cmdkPowerAction('restart')}>
                            <HugeIconsZap fill='currentColor' />
                            Reiniciar
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={status === 'offline'} onSelect={() => cmdkPowerAction('stop')}>
                            <HugeIconsZap fill='currentColor' />
                            Detener
                        </Command.Item>
                    </Can>
                </Command.Group>
            </Command.List>
        </Command.Dialog>
    );
};

export default CommandMenu;
