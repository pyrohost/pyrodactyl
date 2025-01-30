import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import ResourceCard from '../Common/ResourceEdit.card';
import ServerManagementLayout from '@/components/Layouts/ServerLayout';


interface Server {
    identifier: string;
    uuidShort: string;
    name: string;
    memory: number;
    disk: number;
    cpu: number;
    allocation_limit: number;
    database_limit: number;
    backup_limit: number;
}

interface AvailableResources {
    memory: number;
    disk: number;
    cpu: number;
    allocations: number;
    databases: number;
    backups: number;
}

interface ResourceEditorProps {
    server: Server;
    availableResources: AvailableResources;
}

interface FormData {
    memory: number;
    disk: number;
    cpu: number;
    allocation_limit: number;
    database_limit: number;
    backup_limit: number;
}

export default function ResourceEditor({ server, availableResources }: ResourceEditorProps) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
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
        <ServerManagementLayout
            serverId={server.identifier}
            serverName={`Server / ${server.name} / Resources`}
            sidebarTab="home"
        >
            <div className="p-4 space-y-4">
                <ResourceCard
                   
                    values={data}
                    onChange={(key: keyof FormData, value: number) => setData(key, value)}
                    onSubmit={onSubmit}
                    availableResources={availableResources}
                    errors={errors}
                    isProcessing={processing}
                />
            </div>
        </ServerManagementLayout>
    );
}