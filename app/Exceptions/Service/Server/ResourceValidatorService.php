<?php

namespace Pterodactyl\Exceptions\Service\Server;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;

class ResourceValidatorService
{
    public function validate(array $data, Server $server, User $user): void 
    {
        // Calculate resource changes (positive = increase, negative = decrease)
        $resourceChanges = [
            'memory' => $data['memory'] - $server->memory,
            'disk' => $data['disk'] - $server->disk,
            'cpu' => $data['cpu'] - $server->cpu,
            'allocations' => $data['allocation_limit'] - $server->allocation_limit,
            'databases' => $data['database_limit'] - $server->database_limit,
            'backups' => $data['backup_limit'] - $server->backup_limit,
        ];

        // Calculate what resources would be after change
        $newTotalUsed = [
            'memory' => $user->resources['memory'] + $resourceChanges['memory'],
            'disk' => $user->resources['disk'] + $resourceChanges['disk'],
            'cpu' => $user->resources['cpu'] + $resourceChanges['cpu'],
            'allocations' => $user->resources['allocations'] + $resourceChanges['allocations'],
            'databases' => $user->resources['databases'] + $resourceChanges['databases'],
            'backups' => $user->resources['backups'] + $resourceChanges['backups'],
        ];

        // Check if new totals would exceed user limits
        if ($newTotalUsed['memory'] > $user->limits['memory']) {
            throw new DisplayException("Memory allocation would exceed your limit of {$user->limits['memory']}MB");
        }

        if ($newTotalUsed['disk'] > $user->limits['disk']) {
            throw new DisplayException("Disk allocation would exceed your limit of {$user->limits['disk']}MB");
        }

        if ($newTotalUsed['cpu'] > $user->limits['cpu']) {
            throw new DisplayException("CPU allocation would exceed your limit of {$user->limits['cpu']}%");
        }

        if ($newTotalUsed['allocations'] > $user->limits['allocations']) {
            throw new DisplayException("Allocation count would exceed your limit of {$user->limits['allocations']}");
        }

        if ($newTotalUsed['databases'] > $user->limits['databases']) {
            throw new DisplayException("Database count would exceed your limit of {$user->limits['databases']}");
        }

        if ($newTotalUsed['backups'] > $user->limits['backups']) {
            throw new DisplayException("Backup count would exceed your limit of {$user->limits['backups']}");
        }

        // Prevent zero values for critical resources
        if ($data['memory'] <= 0 || $data['disk'] <= 0 || $data['cpu'] <= 0) {
            throw new DisplayException('Memory, disk and CPU must be greater than 0');
        }

        // Update user's resource usage with the changes
        $user->resources = $newTotalUsed;
        $user->save();
    }
}