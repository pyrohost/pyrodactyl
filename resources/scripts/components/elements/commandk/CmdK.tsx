import { Command } from 'cmdk';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.module.css';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { toast } from 'sonner';
import HugeIconsHome from '../hugeicons/Home';
import HugeIconsFolder from '../hugeicons/Folder';
import HugeIconsDatabase from '../hugeicons/Database';
import HugeIconsCloudUp from '../hugeicons/CloudUp';
import HugeIconsConnections from '../hugeicons/Connections';
import HugeIconsDashboardSettings from '../hugeicons/DashboardSettings';
import HugeIconsZap from '../hugeicons/Zap';

const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    // controls server power status
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const cmdkPowerAction = (action: string) => {
        if (instance) {
            if (action === 'start') {
                toast.success('Your server is starting!');
            } else if (action === 'restart') {
                toast.success('Your server is restarting.');
            } else {
                toast.success('Your server is being stopped.');
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    const cmdkNavigate = (url: string) => {
        navigate(url);
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
        <Command.Dialog open={open} onOpenChange={setOpen} label='Global Command Menu'>
            <Command.Input />
            <Command.List>
                <Command.Empty>No results found.</Command.Empty>

                <Command.Group heading='Pages'>
                    <Command.Item onSelect={() => cmdkNavigate('/')}>
                        <HugeIconsHome fill='currentColor' />
                        Home
                    </Command.Item>
                    <Can action={'file.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/files')}>
                            <HugeIconsFolder fill='currentColor' />
                            Files
                        </Command.Item>
                    </Can>
                    <Can action={'database.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/databases')}>
                            <HugeIconsDatabase fill='currentColor' />
                            Databases
                        </Command.Item>
                    </Can>
                    <Can action={'backup.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/backups')}>
                            <HugeIconsCloudUp fill='currentColor' />
                            Backups
                        </Command.Item>
                    </Can>
                    <Can action={'allocation.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/network')}>
                            <HugeIconsConnections fill='currentColor' />
                            Networking
                        </Command.Item>
                    </Can>
                    <Can action={['settings.*', 'file.sftp']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/settings')}>
                            <HugeIconsDashboardSettings fill='currentColor' />
                            Settings
                        </Command.Item>
                    </Can>
                </Command.Group>
                <Command.Group heading='Server'>
                    <Can action={'control.start'}>
                        <Command.Item disabled={status !== 'offline'} onSelect={() => cmdkPowerAction('start')}>
                            <HugeIconsZap fill='currentColor' />
                            Start Server
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={!status} onSelect={() => cmdkPowerAction('restart')}>
                            <HugeIconsZap fill='currentColor' />
                            Restart Server
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={status === 'offline'} onSelect={() => cmdkPowerAction('stop')}>
                            <HugeIconsZap fill='currentColor' />
                            Stop Server
                        </Command.Item>
                    </Can>
                </Command.Group>
            </Command.List>
        </Command.Dialog>
    );
};

export default CommandMenu;
