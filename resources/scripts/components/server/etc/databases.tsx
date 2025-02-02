import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/inertia-react';
import getServerDatabases, { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';
import createServerDatabase from '@/api/server/databases/createServerDatabase';

// shadcn UI components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';

const ServerDatabases: React.FC = () => {
  const { server } = usePage().props as { server: { uuid: string } };
  const [databases, setDatabases] = useState<ServerDatabase[]>([]);
  const [newDbName, setNewDbName] = useState('');
  const [newConnectionsFrom, setNewConnectionsFrom] = useState('');

  const fetchDatabases = () => {
    getServerDatabases(server.uuid)
      .then((dbs) => setDatabases(dbs))
      .catch((error) => console.error(error));
  };

  const handleRotatePassword = (databaseId: string) => {
    rotateDatabasePassword(server.uuid, databaseId)
      .then((updatedDb) => {
        setDatabases((prev) =>
          prev.map((db) => (db.id === updatedDb.id ? updatedDb : db))
        );
      })
      .catch((error) => console.error(error));
  };

  const handleCreateDatabase = () => {
    if (!newDbName || !newConnectionsFrom) return;
    createServerDatabase(server.uuid, {
      databaseName: newDbName,
      connectionsFrom: newConnectionsFrom,
    })
      .then((newDb) => {
        setDatabases((prev) => [...prev, newDb]);
        setNewDbName('');
        setNewConnectionsFrom('');
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Server Databases</h2>
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
          {databases.map((db) => (
            <TableRow key={db.id}>
              <TableCell>{db.name}</TableCell>
              <TableCell>{db.username}</TableCell>
              <TableCell>{db.connectionString}</TableCell>
              <TableCell>{db.allowConnectionsFrom}</TableCell>
              <TableCell>{db.password || 'N/A'}</TableCell>
              <TableCell>
                <Button onClick={() => handleRotatePassword(db.id)}>
                  Rotate Password
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Create New Database</h3>
        <div className="flex flex-col gap-2">
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
          <Button onClick={handleCreateDatabase}>Create Database</Button>
        </div>
      </div>
    </Card>
  );
};

export default ServerDatabases;