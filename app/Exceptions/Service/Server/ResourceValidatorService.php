<?php

namespace Pterodactyl\Exceptions\Service\Server;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;

class ResourceValidatorService
{
    public function validate(array $data, Server $server, User $user): void 
    {
        // Calculate how much resources are being added/removed
        $resourceChanges = [
            'memory' => $data['memory'] - $server->memory,
            'disk' => $data['disk'] - $server->disk,
            'cpu' => $data['cpu'] - $server->cpu,
            'allocations' => $data['allocation_limit'] - $server->allocation_limit,
            'databases' => $data['database_limit'] - $server->database_limit,
            'backups' => $data['backup_limit'] - $server->backup_limit,
        ];

        // Calculate available resources (limit - used + current)
        $availableResources = [
            'memory' => $user->limits['memory'] - $user->resources['memory'] + $server->memory,
            'disk' => $user->limits['disk'] - $user->resources['disk'] + $server->disk,
            'cpu' => $user->limits['cpu'] - $user->resources['cpu'] + $server->cpu,
            'allocations' => $user->limits['allocations'] - $user->resources['allocations'] + $server->allocation_limit,
            'databases' => $user->limits['databases'] - $user->resources['databases'] + $server->database_limit,
            'backups' => $user->limits['backups'] - $user->resources['backups'] + $server->backup_limit,
        ];

        // Validate critical resources are not zero
        if ($data['memory'] <= 0) {
            throw new DisplayException('Memory must be greater than 0');
        }

        if ($data['disk'] <= 0) {
            throw new DisplayException('Disk space must be greater than 0');
        }

        if ($data['cpu'] <= 0) {
            throw new DisplayException('CPU must be greater than 0');
        }

        // Validate against available resources
        if ($data['memory'] > $availableResources['memory']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['memory']}MB of memory to this server");
        }

        if ($data['disk'] > $availableResources['disk']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['disk']}MB of disk space to this server");
        }

        if ($data['cpu'] > $availableResources['cpu']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['cpu']}% of CPU to this server");
        }

        if ($data['allocation_limit'] > $availableResources['allocations']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['allocations']} allocations to this server");
        }

        if ($data['database_limit'] > $availableResources['databases']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['databases']} databases to this server");
        }

        if ($data['backup_limit'] > $availableResources['backups']) {
            throw new DisplayException("Cannot allocate more than {$availableResources['backups']} backups to this server");
        }
    }
}