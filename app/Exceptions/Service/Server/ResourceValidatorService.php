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

    // Calculate resources used by other servers (excluding current server)
    $usedByOthers = [
        'memory' => $user->resources['memory'] - $server->memory,
        'disk' => $user->resources['disk'] - $server->disk,
        'cpu' => $user->resources['cpu'] - $server->cpu,
        'allocations' => $user->resources['allocations'] - $server->allocation_limit,
        'databases' => $user->resources['databases'] - $server->database_limit,
        'backups' => $user->resources['backups'] - $server->backup_limit,
    ];

    // Calculate what's actually available for this server
    $availableResources = [
        'memory' => $user->limits['memory'] - $usedByOthers,
        'disk' => $user->limits['disk'] - $usedByOthers,
        'cpu' => $user->limits['cpu'] - $usedByOthers['cpu'],
        'allocations' => $user->limits['allocations'] - $usedByOthers['allocations'],
        'databases' => $user->limits['databases'] - $usedByOthers['databases'],
        'backups' => $user->limits['backups'] - $usedByOthers['backups'],
    ];

    // Validate against available resources
    if ($data['cpu'] > $availableResources['cpu']) {
        throw new DisplayException('Insufficient CPU available. You can use up to ' . $availableResources['cpu'] . '% for this server');
    }

    // Check if the CHANGES exceed what's actually available 
    if ($resourceChanges['memory'] > $availableResources['memory']) {
        throw new DisplayException('Insufficient memory available. You can only add up to ' . $availableResources['memory'] . 'MB more');
    }

    if ($resourceChanges['disk'] > $availableResources['disk']) {
        throw new DisplayException('Insufficient disk space available. You can only add up to ' . $availableResources['disk'] . 'MB more');
    }

    if ($resourceChanges['cpu'] > $availableResources['cpu']) {
        throw new DisplayException('Insufficient CPU available. You can only add up to ' . $availableResources['cpu'] . '% more');
    }

    if ($resourceChanges['allocations'] > $availableResources['allocations']) {
        throw new DisplayException('Insufficient allocations available');
    }

    if ($resourceChanges['databases'] > $availableResources['databases']) {
        throw new DisplayException('Insufficient databases available');
    }

    if ($resourceChanges['backups'] > $availableResources['backups']) {
        throw new DisplayException('Insufficient backups available');
    }

    // Prevent zero values for required resources
    if ($data['memory'] <= 0 || $data['disk'] <= 0 || $data['cpu'] <= 0) {
        throw new DisplayException('Memory, disk and CPU must be greater than 0');
    }
}
}