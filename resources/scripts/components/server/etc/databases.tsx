import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import getServerDatabases, { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import { ClipboardCopy, Loader2, Database } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const ServerDatabases: React.FC = () => {
  const { server } = usePage().props;
  const { toast } = useToast();
  const [databases, setDatabases] = useState<ServerDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDbName, setNewDbName] = useState('');
  const [newConnectionsFrom, setNewConnectionsFrom] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const canCreateDatabase = server.feature_limits.databases > databases.length;

  const fetchDatabases = () => {
    setLoading(true);
    getServerDatabases(server.uuid)
      .then((dbs) => setDatabases(dbs))
      .catch((error) => toast({ 
        variant: "destructive",
        title: "Error fetching databases",
        description: error.message 
      }))
      .finally(() => setLoading(false));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard!" });
  };

  const handleRotatePassword = async (databaseId: string) => {
    try {
      const updatedDb = await rotateDatabasePassword(server.uuid, databaseId);
      setDatabases((prev) =>
        prev.map((db) => (db.id === updatedDb.id ? updatedDb : db))
      );
      toast({ description: "Password rotated successfully" });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error rotating password",
        description: error.message 
      });
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName || !newConnectionsFrom) return;
    setIsCreating(true);
    try {
      const newDb = await createServerDatabase(server.uuid, {
        databaseName: newDbName,
        connectionsFrom: newConnectionsFrom,
      });
      setDatabases((prev) => [...prev, newDb]);
      setNewDbName('');
      setNewConnectionsFrom('');
      toast({ description: "Database created successfully" });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error creating database",
        description: error.message 
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  if (!server.feature_limits.databases) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Database className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Database Access</h3>
            <p className="text-sm text-muted-foreground">
              You cannot create any databases for this server.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Databases</CardTitle>
        <CardDescription>
          Manage your server databases. You can create up to {server.feature_limits.databases} databases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Connection</TableCell>
                  <TableCell>Allowed Connections</TableCell>
                  <TableCell>Password</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {databases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No databases found
                    </TableCell>
                  </TableRow>
                ) : (
                  databases.map((db) => (
                    <TableRow key={db.id}>
                      <TableCell>{db.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {db.username}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.username)}
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {db.connectionString}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.connectionString)}
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{db.allowConnectionsFrom}</TableCell>
                      <TableCell>
                        {db.password ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">●●●●●●</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(db.password!)}
                            >
                              <ClipboardCopy className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotatePassword(db.id)}
                        >
                          Rotate Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {canCreateDatabase && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Create New Database</h3>
                <div className="grid gap-4">
                  <Input
                    type="text"
                    placeholder="Database Name"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Allowed Connections From"
                    value={newConnectionsFrom}
                    onChange={(e) => setNewConnectionsFrom(e.target.value)}
                  />
                  <Button
                    onClick={handleCreateDatabase}
                    disabled={isCreating || !newDbName || !newConnectionsFrom}
                  >
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Database
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerDatabases;