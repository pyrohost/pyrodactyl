
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ResourceValues {
    memory: number;
    disk: number;
    cpu: number;
    allocation_limit: number;
    database_limit: number;
    backup_limit: number;
}

interface ResourceCardProps {
    values: ResourceValues;
    onChange: (key: keyof ResourceValues, value: number) => void;
    onSubmit: (e: React.FormEvent) => void;
    availableResources: {
        memory: number;
        disk: number;
        cpu: number;
        allocations: number;
        databases: number;
        backups: number;
    };
    errors?: Partial<Record<keyof ResourceValues, string>>;
    isProcessing?: boolean;
}



export default function ResourceCard({
    values,
    onChange,
    onSubmit,
    availableResources,
    errors = {},
    isProcessing = false
}: ResourceCardProps) {
    return (
        <Card className="w-full max-w-2xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Server Resources</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">CPU (%)</label>
                        <Input 
                            type="number"
                            value={values.cpu}
                            onChange={e => onChange('cpu', Number(e.target.value))}
                            min={1}
                            
                            className="w-full"
                        />
                        {errors.cpu && <p className="text-red-500 text-sm">{errors.cpu}</p>}
                        <span className="text-sm text-gray-500">
                            Resources left: {availableResources.cpu}%
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Memory (MB)</label>
                        <Input 
                            type="number"
                            value={values.memory}
                            onChange={e => onChange('memory', Number(e.target.value))}
                            min={1}
                            
                            className="w-full"
                        />
                        {errors.memory && <p className="text-red-500 text-sm">{errors.memory}</p>}
                        <span className="text-sm text-gray-500">
                            Resources left: {availableResources.memory}MB
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Disk (MB)</label>
                        <Input 
                            type="number"
                            value={values.disk}
                            onChange={e => onChange('disk', Number(e.target.value))}
                            min={1}
                            
                            className="w-full"
                        />
                        {errors.disk && <p className="text-red-500 text-sm">{errors.disk}</p>}
                        <span className="text-sm text-gray-500">
                            Resources left: {availableResources.disk}MB
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Allocation Limit</label>
                        <Input 
                            type="number"
                            value={values.allocation_limit}
                            onChange={e => onChange('allocation_limit', Number(e.target.value))}
                        
                            className="w-full"
                        />
                        {errors.allocation_limit && <p className="text-red-500 text-sm">{errors.allocation_limit}</p>}
                        <span className="text-sm text-gray-500">
                            Resources left: {availableResources.allocations}
                        </span>
                    </div>

                    <Button type="submit" disabled={isProcessing} className="w-full">
                        Save Changes
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}