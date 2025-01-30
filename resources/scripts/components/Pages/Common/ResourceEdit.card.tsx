import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import renameServer from '@/api/server/renameServer';

const formSchema = z.object({
    name: z.string().min(1).max(40),
    description: z.string().max(200).optional(),
});

interface ResourceCardProps {
    server: {
        uuid: string;
        name: string;
        description?: string;
    };
    values: {
        memory: number;
        disk: number;
        cpu: number;
        allocation_limit: number;
        database_limit: number;
        backup_limit: number;
    };
    onChange: (key: string, value: number) => void;
    onSubmit: (e: React.FormEvent) => void;
    availableResources: {
        memory: number;
        disk: number;
        cpu: number;
        allocations: number;
        databases: number;
        backups: number;
    };
    errors?: Record<string, string>;
    isProcessing?: boolean;
}

export default function ResourceCard({
    server,
    values,
    onChange,
    onSubmit,
    availableResources,
    errors = {},
    isProcessing = false
}: ResourceCardProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: server.name,
            description: server.description || '',
        },
    });

    const onRenameSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            await renameServer(server.uuid, values.name, values.description);
            toast.success('Server renamed successfully');
            setOpen(false);
            window.location.reload();
        } catch (error) {
            toast.error('Failed to rename server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Server Configuration</CardTitle>
                        <CardDescription>Manage your server's resources and details</CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rename
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Rename Server</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onRenameSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Server Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isLoading} className="w-full">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                Available: {availableResources.cpu}%
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
                                Available: {availableResources.memory}MB
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
                                Available: {availableResources.disk}MB
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Allocation Limit</label>
                            <Input 
                                type="number"
                                value={values.allocation_limit}
                                onChange={e => onChange('allocation_limit', Number(e.target.value))}
                                min={0}
                                className="w-full"
                            />
                            {errors.allocation_limit && <p className="text-red-500 text-sm">{errors.allocation_limit}</p>}
                            <span className="text-sm text-gray-500">
                                Available: {availableResources.allocations}
                            </span>
                        </div>
                    </div>

                    <Button type="submit" disabled={isProcessing} className="w-full">
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating Resources...
                            </>
                        ) : (
                            'Update Resources'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}