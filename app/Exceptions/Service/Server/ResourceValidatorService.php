<?php

namespace Pterodactyl\Exceptions\Service\Server;



use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;




class ResourceValidatorService
{
    public function validate(array $data, Server $server, User $user): void 
{
    // Calculate resource differences (how much is being added/removed)
    $resourceChanges = [
        'memory' => $data['memory'] - $server->memory,
        'disk' => $data['disk'] - $server->disk,
        'cpu' => $data['cpu'] - $server->cpu,
        'allocations' => $data['allocation_limit'] - $server->allocation_limit,
        'databases' => $data['database_limit'] - $server->database_limit,
        'backups' => $data['backup_limit'] - $server->backup_limit,
    ];

    // Calculate available resources (excluding current server's usage)
    $availableResources = [
        'memory' => $user->limits['memory'] - $user->resources['memory'],
        'disk' => $user->limits['disk'] - $user->resources['disk'],
        'cpu' => $user->limits['cpu'] - $user->resources['cpu'],
        'allocations' => $user->limits['allocations'] - $user->resources['allocations'],
        'databases' => $user->limits['databases'] - $user->resources['databases'],
        'backups' => $user->limits['backups'] - $user->resources['backups'],
    ];

    // Validate each resource change
    if ($data['memory'] <= 0) {
        throw new DisplayException('Memory must be greater than 0');
    }
    if ($resourceChanges['memory'] > $availableResources['memory']) {
        throw new DisplayException('Insufficient memory resources. You are trying to add ' . $resourceChanges['memory'] . 'MB more than available.');
    }

    if ($data['disk'] <= 0) {
        throw new DisplayException('Disk must be greater than 0');
    }
    if ($resourceChanges['disk'] > $availableResources['disk']) {
        throw new DisplayException('Insufficient disk resources. You are trying to add ' . $resourceChanges['disk'] . 'MB more than available.');
    }

    if ($data['cpu'] <= 0) {
        throw new DisplayException('CPU must be greater than 0');
    }
    if ($resourceChanges['cpu'] > $availableResources['cpu']) {
        throw new DisplayException('Insufficient CPU resources. You are trying to add ' . $resourceChanges['cpu'] . '% more than available.');
    }

    // Optional resources can be 0
    if ($resourceChanges['allocations'] > $availableResources['allocations']) {
        throw new DisplayException('Insufficient allocation resources available.');
    }

    if ($resourceChanges['databases'] > $availableResources['databases']) {
        throw new DisplayException('Insufficient database resources available.');
    }

    if ($resourceChanges['backups'] > $availableResources['backups']) {
        throw new DisplayException('Insufficient backup resources available.');
    }
}
}