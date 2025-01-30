<?php

namespace Pterodactyl\Exceptions\Service\Server;



use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;




class ResourceValidatorService
{
    public function validate(array $data, Server $server, User $user): void 
    {
        // Calculate increments/decrements from current values
        $resourceChanges = [
            'memory' => $data['memory'] - $server->memory,
            'disk' => $data['disk'] - $server->disk,
            'cpu' => $data['cpu'] - $server->cpu,
            'allocations' => $data['allocation_limit'] - $server->allocation_limit,
            'databases' => $data['database_limit'] - $server->database_limit,
            'backups' => $data['backup_limit'] - $server->backup_limit,
        ];

        // Get current used resources (excluding this server)
        $currentUsed = [
            'memory' => $user->resources['memory'] - $server->memory,
            'disk' => $user->resources['disk'] - $server->disk,
            'cpu' => $user->resources['cpu'] - $server->cpu,
            'allocations' => $user->resources['allocations'] - $server->allocation_limit,
            'databases' => $user->resources['databases'] - $server->database_limit,
            'backups' => $user->resources['backups'] - $server->backup_limit,
        ];

        // Check if new values would exceed limits
        if (($currentUsed['memory'] + $data['memory']) > $user->limits['memory']) {
            throw new DisplayException('Memory allocation would exceed your limit');
        }

        if (($currentUsed['disk'] + $data['disk']) > $user->limits['disk']) {
            throw new DisplayException('Disk allocation would exceed your limit');
        }

        if (($currentUsed['cpu'] + $data['cpu']) > $user->limits['cpu']) {
            throw new DisplayException('CPU allocation would exceed your limit');
        }

        // Optional resources
        if (($currentUsed['allocations'] + $data['allocation_limit']) > $user->limits['allocations']) {
            throw new DisplayException('Allocation limit would exceed your limit');
        }

        if (($currentUsed['databases'] + $data['database_limit']) > $user->limits['databases']) {
            throw new DisplayException('Database limit would exceed your limit');
        }

        if (($currentUsed['backups'] + $data['backup_limit']) > $user->limits['backups']) {
            throw new DisplayException('Backup limit would exceed your limit');
        }

        // Prevent zero values for required resources
        if ($data['memory'] <= 0 || $data['disk'] <= 0 || $data['cpu'] <= 0) {
            throw new DisplayException('Memory, disk and CPU must be greater than 0');
        }
    }
}