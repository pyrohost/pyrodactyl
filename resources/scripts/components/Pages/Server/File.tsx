import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ServerLayout from '@/components/Layouts/ServerLayout';
import loadDirectory from '@/api/server/files/loadDirectory';
import { FileIcon, FolderIcon, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PowerButtons from '@/components/server/console/PowerButtons';
import FileManager from '@/components/server/files/filelist';
import { FileButton } from '@/components/server/files/filebuttons';

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
                <div className="grid grid-cols-4 gap-4 p-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-[100px] w-full" />
                    ))}
                </div>
            </ServerLayout>
        );
    }

    return (
        <ServerLayout 
                    serverId={server.identifier}
                    serverName={`Server / ${server.name} / File Manager`}
                    sidebarTab="files"
                >
            <Head title="File Manager" />
            <PowerButtons serverId={server.uuid}/>
        
            <FileManager serverId={server.uuid} />
           
        </ServerLayout>
    );
}