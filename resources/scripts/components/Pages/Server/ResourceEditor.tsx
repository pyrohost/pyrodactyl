import React from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ResourceEditorProps {
    server: {
        id: number;
        memory: number;
        disk: number;
        cpu: number;
        allocation_limit: number;
        database_limit: number;
        backup_limit: number;
    };
    limits: {
        memory: number;
        disk: number;
        cpu: number;
        allocations: number;
        databases: number;
        backups: number;
    };
    availableResources: {
        memory: number;
        disk: number;
        cpu: number;
        allocations: number;
        databases: number;
        backups: number;
    };
}

export default function ResourceEditor({ server, limits, availableResources }: ResourceEditorProps) {
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
        put(route('servers.resources.update', server.id));
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Edit Server Resources</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Memory (MB)</label>
                        <Input 
                            type="number"
                            value={data.memory}
                            onChange={e => setData('memory', Number(e.target.value))}
                            min={1}
                            max={availableResources.memory}
                            className="w-full"
                        />
                        {errors.memory && <p className="text-red-500 text-sm">{errors.memory}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.memory}MB
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Disk (MB)</label>
                        <Input 
                            type="number"
                            value={data.disk}
                            onChange={e => setData('disk', Number(e.target.value))}
                            min={1}
                            max={availableResources.disk}
                            className="w-full"
                        />
                        {errors.disk && <p className="text-red-500 text-sm">{errors.disk}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.disk}MB
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">CPU (%)</label>
                        <Input 
                            type="number"
                            value={data.cpu}
                            onChange={e => setData('cpu', Number(e.target.value))}
                            min={1}
                            max={availableResources.cpu}
                            className="w-full"
                        />
                        {errors.cpu && <p className="text-red-500 text-sm">{errors.cpu}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.cpu}%
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Allocation Limit</label>
                        <Input 
                            type="number"
                            value={data.allocation_limit}
                            onChange={e => setData('allocation_limit', Number(e.target.value))}
                            min={1}
                            max={availableResources.allocations}
                            className="w-full"
                        />
                        {errors.allocation_limit && <p className="text-red-500 text-sm">{errors.allocation_limit}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.allocations}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Database Limit</label>
                        <Input 
                            type="number"
                            value={data.database_limit}
                            onChange={e => setData('database_limit', Number(e.target.value))}
                            min={0}
                            max={availableResources.databases}
                            className="w-full"
                        />
                        {errors.database_limit && <p className="text-red-500 text-sm">{errors.database_limit}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.databases}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Backup Limit</label>
                        <Input 
                            type="number"
                            value={data.backup_limit}
                            onChange={e => setData('backup_limit', Number(e.target.value))}
                            min={0}
                            max={availableResources.backups}
                            className="w-full"
                        />
                        {errors.backup_limit && <p className="text-red-500 text-sm">{errors.backup_limit}</p>}
                        <span className="text-sm text-gray-500">
                            Available: {availableResources.backups}
                        </span>
                    </div>

                    <Button type="submit" disabled={processing}>
                        Update Resources
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}