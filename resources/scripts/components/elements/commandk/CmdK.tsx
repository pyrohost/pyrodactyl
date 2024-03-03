import { Command } from 'cmdk';
import { useState, useEffect } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import './styles.module.css';
import Can from '@/components/elements/Can';
import HugeIconsHome from '../hugeicons/Home';
import HugeIconsFolder from '../hugeicons/Folder';
import HugeIconsDatabase from '../hugeicons/Database';
import HugeIconsCloudUp from '../hugeicons/CloudUp';
import HugeIconsConnections from '../hugeicons/Connections';
import HugeIconsDashboardSettings from '../hugeicons/DashboardSettings';

const CommandMenu = () => {
    const match = useRouteMatch<{ id: string }>();

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    const [open, setOpen] = useState(false);
    const history = useHistory();

    const cmdkNavigate = (url: string) => {
        history.push(to(url, true));
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
            </Command.List>
        </Command.Dialog>
    );
};

export default CommandMenu;
