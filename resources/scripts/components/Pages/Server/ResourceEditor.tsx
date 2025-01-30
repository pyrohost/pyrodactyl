import ResourceCard from '@/components/Server/ResourceCard';
import { useForm } from '@inertiajs/react';
import { toast, Toaster } from 'sonner'
import RenameServerDialog from '../Common/Rename';

export default function ResourceEditor({ server, availableResources }: ResourceEditorProps) {
    const { data, setData, put, processing, errors } = useForm({
        memory: server.memory,
        disk: server.disk,
        cpu: server.cpu,
        allocation_limit: server.allocation_limit,
        database_limit: server.database_limit,
        backup_limit: server.backup_limit
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.cpu <= 0 || data.memory <= 0 || data.disk <= 0) {
            toast.error('CPU, Memory and Disk cannot be zero');
            return;
        }
        put(`/server/${server.uuidShort}/resources`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 ">
        <ResourceCard 
            values={data}
            onChange={(key, value) => setData(key, value)}
            onSubmit={onSubmit}
            availableResources={availableResources}
            errors={errors}
            isProcessing={processing}
        />
        <RenameServerDialog />
        
    </div>
        
    );
}