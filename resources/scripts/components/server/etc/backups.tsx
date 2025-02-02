import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Loader2, Archive } from 'lucide-react';
import { format } from 'date-fns';
import useServerBackups, { Context } from '@/api/swr/getServerBackups';
import createServerBackup from '@/api/server/backups/createServerBackup';
import deleteBackup from '@/api/server/backups/deleteBackup';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import { usePage } from '@inertiajs/react';

const BackupManager = () => {
    const { server } = usePage().props;
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const { data, mutate } = useServerBackups();
    const [isCreating, setIsCreating] = useState(false);
    const [backupName, setBackupName] = useState('');

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await createServerBackup(server.uuid, {
                name: backupName,
                isLocked: false,
            });
            await mutate();
            setBackupName('');
            toast({ description: "Backup created successfully" });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error creating backup",
                description: error.message
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (backupId: string) => {
        try {
            await deleteBackup(server.uuid, backupId);
            await mutate();
            toast({ description: "Backup deleted successfully" });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error deleting backup",
                description: error.message
            });
        }
    };

    const handleDownload = async (backupId: string) => {
        try {
            const url = await getBackupDownloadUrl(server.uuid, backupId);
            window.location.href = url;
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error downloading backup",
                description: error.message
            });
        }
    };

    if (!server.feature_limits.backups) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Archive className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Backup Access</h3>
                        <p className="text-sm text-muted-foreground">
                            You cannot create any backups for this server.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    
    return (
        <Context.Provider value={{ page, setPage }}>
            <Card>
                <CardHeader>
                    <CardTitle>Backups</CardTitle>
                    <CardDescription>
                        Create and manage server backups. {data?.backupCount ?? 0} total backups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!data ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="w-full h-12" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 space-y-4">
                                <h3 className="text-lg font-semibold">Create Backup</h3>
                                <div className="flex items-center gap-4">
                                    <Input
                                        className="max-w-md"
                                        placeholder="Backup name (optional)"
                                        value={backupName}
                                        onChange={e => setBackupName(e.target.value)}
                                    />
                                    <Button onClick={handleCreate} disabled={isCreating}>
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Backup
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center py-6">
                                                    <Archive className="w-12 h-12 text-muted-foreground mb-4" />
                                                    <p>No backups have been created yet.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.items.map(backup => (
                                            <TableRow key={backup.uuid}>
                                                <TableCell>{backup.name || backup.uuid}</TableCell>
                                                <TableCell>{Math.round(backup.bytes / 1024 / 1024)}MB</TableCell>
                                                <TableCell>{format(backup.createdAt, 'PPp')}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(backup.uuid)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(backup.uuid)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {data.pagination.count > 1 && (
                                <div className="flex items-center justify-center space-x-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {page} of {data.pagination.count}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(data.pagination.count, p + 1))}
                                        disabled={page === data.pagination.count}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Context.Provider>
    );
};



export default BackupManager;