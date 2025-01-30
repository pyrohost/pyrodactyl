<?php

namespace Pterodactyl\Exceptions\Service\Server;



use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;


class ResourceValidatorService
{
    public function validate(array $data, Server $server, User $user): void 
    {
        $resourcesLeft = [
            'memory' => $user->limits['memory'] - $user->resources['memory'],
            'disk' => $user->limits['disk'] - $user->resources['disk'],
            'cpu' => $user->limits['cpu'] - $user->resources['cpu'],
            'allocations' => $user->limits['allocations'] - $user->resources['allocations'],
            'backups' => $user->limits['backups'] - $user->resources['backups'],
            'databases' => $user->limits['databases'] - $user->resources['databases'],
        ];

        // Add current server resources back
        $resourcesLeft['memory'] += $server->memory;
        $resourcesLeft['disk'] += $server->disk;
        $resourcesLeft['cpu'] += $server->cpu;
        $resourcesLeft['allocations'] += $server->allocation_limit;
        $resourcesLeft['databases'] += $server->database_limit;
        $resourcesLeft['backups'] += $server->backup_limit;

        if ($data['memory'] <= 0 || $data['memory'] > $resourcesLeft['memory']) {
            throw new DisplayException('Invalid memory allocation specified.');
        }

        if ($data['disk'] <= 0 || $data['disk'] > $resourcesLeft['disk']) {
            throw new DisplayException('Invalid disk space specified.');
        }

        if ($data['cpu'] <= 0 || $data['cpu'] > $resourcesLeft['cpu']) {
            throw new DisplayException('Invalid CPU limit specified.');
        }

        if ($data['allocation_limit'] <= 0 || $data['allocation_limit'] > $resourcesLeft['allocations']) {
            throw new DisplayException('Invalid allocation limit specified.');
        }

        if ($data['database_limit'] < 0 || $data['database_limit'] > $resourcesLeft['databases']) {
            throw new DisplayException('Invalid database limit specified.');
        }

        if ($data['backup_limit'] < 0 || $data['backup_limit'] > $resourcesLeft['backups']) {
            throw new DisplayException('Invalid backup limit specified.');
        }
    }
}