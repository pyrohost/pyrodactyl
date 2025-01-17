import { FcSettings } from "react-icons/fc"; 
import { TbPlanet } from "react-icons/tb"; 
import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ServerLayout from '@/components/Layouts/ServerLayout';
import loadDirectory from '@/api/server/files/loadDirectory';
import { FileIcon, FolderIcon, Flame, LucidePlaneTakeoff, LucideSettings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PowerButtons from '@/components/server/console/PowerButtons';
import FileManager from '@/components/server/files/filelist';
import { FileButton } from '@/components/server/files/filebuttons';
import ReinstallButton from '../Common/Reinstall-Button';
import RenameServer from '@/api/server/renameServer';
import RenameServerDialog from '../Common/Rename';
import SFTPDetails from '../Common/SFPT';
import LogoLoader from '@/components/elements/ServerLoad';
import DebugInfo from '../Common/Debug';
import StartupVariables from '../Common/Startup';

export default function Show() {
    const { server } = usePage<ServerPageProps>().props;
    const [files, setFiles] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDirectory, setCurrentDirectory] = useState('/');

    const fetchFiles = async (path: string = '/') => {
        try {
            setLoading(true);
            const files = await loadDirectory(server.uuid, path);
            setFiles(files);
            console.log('Files loaded:', files);
        } catch (err) {
            setError('Failed to load directory contents');
            console.error('Error loading directory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(currentDirectory);
    }, [server.uuid, currentDirectory]);

    if (loading) {
        return (
            <ServerLayout>
                <div className="items-center justify-center flex h-full w-full animate-bounce">
                    <LogoLoader size="160px"/>
                    
                </div>
            </ServerLayout>
        );
    }

    return (
        <ServerLayout 
            serverId={server.identifier}
            serverName={`Server / ${server.name} / Settings`}
            sidebarTab="settings"
        >
            <Head title="Settings" />
            <PowerButtons serverId={server.uuid} />
            <div className="p-6">
    <div>
        <h2 className="text-4xl font-semibold flex items-center gap-2 mb-5">
        <TbPlanet  className="h-9 w-9" />
            Server Settings
        </h2>
    </div>
    <StartupVariables/>
    <h2 className="text-4xl font-semibold flex items-center gap-2 py-5">
        <LucideSettings className="h-9 w-9" />
            Advance  Settings
        </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 ">
        <ReinstallButton />
        <RenameServerDialog />
        <SFTPDetails/>
        <DebugInfo/>
    </div>
    <div className="mt-6">
        {/* Other content can go here */}
    </div>
</div>
           
        </ServerLayout>
    );
}