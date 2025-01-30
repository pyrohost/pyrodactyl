import React from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ResourceEditorProps {
    server: {
        uuidShort: string;
        memory: number;
        disk: number;
        cpu: number;
        allocation_limit: number;
        database_limit: number;
        backup_limit: number;
    };
    availableResources: {
        memory: number;
        disk: number;
        cpu: number;
        allocations: number;
        databases: number;
        backups: number;
    };
    userLimits: {
        memory: number;
        disk: number;
        cpu: number;
    };
}

export default function ResourceEditor({ server, availableResources, userLimits }: ResourceEditorProps) {
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
        <Card className="w-full max-w-2xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Server Resources</CardTitle>
                <p className="text-sm text-gray-500">Adjust resource limits for this server</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">CPU (%)</label>
                        <Input 
                            type="number"
                            value={data.cpu}
                            onChange={e => setData('cpu', Number(e.target.value))}
                            min={1}
                            max={server.cpu + availableResources.cpu}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500">
                            Current: {server.cpu}% | Available: {availableResources.cpu}% | Total Limit: {userLimits.cpu}%
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Memory (MB)</label>
                        <Input 
                            type="number"
                            value={data.memory}
                            onChange={e => setData('memory', Number(e.target.value))}
                            min={1}
                            max={server.memory + availableResources.memory}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500">
                            Current: {server.memory}MB | Available: {availableResources.memory}MB | Total Limit: {userLimits.memory}MB
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Disk (MB)</label>
                        <Input 
                            type="number"
                            value={data.disk}
                            onChange={e => setData('disk', Number(e.target.value))}
                            min={1}
                            max={server.disk + availableResources.disk}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500">
                            Current: {server.disk}MB | Available: {availableResources.disk}MB | Total Limit: {userLimits.disk}MB
                        </div>
                    </div>

                    <Button type="submit" disabled={processing}>
                        Update Resources
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}