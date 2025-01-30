<?php

namespace App\Services\Server;

use App\Exceptions\DisplayException;

class ResourceValidatorService
{
    public function validate(array $data, object $server, object $user): void
    {
        // Calculate remaining available resources
        $availableResources = [
            'memory' => $user->limits['memory'] - $user->resources['memory'],
            'disk' => $user->limits['disk'] - $user->resources['disk'],
            'cpu' => $user->limits['cpu'] - $user->resources['cpu'],
            'allocations' => $user->limits['allocations'] - $user->resources['allocations'],
            'databases' => $user->limits['databases'] - $user->resources['databases'],
            'backups' => $user->limits['backups'] - $user->resources['backups']
        ];

        // Calculate requested resource changes
        $requestedChanges = [
            'memory' => $data['memory'] - $server->memory,
            'disk' => $data['disk'] - $server->disk,
            'cpu' => $data['cpu'] - $server->cpu,
            'allocations' => $data['allocation_limit'] - $server->allocation_limit,
            'databases' => $data['database_limit'] - $server->database_limit,
            'backups' => $data['backup_limit'] - $server->backup_limit
        ];

        // Validate each resource
        $this->validateResource('memory', $requestedChanges, $availableResources, 'MB');
        $this->validateResource('disk', $requestedChanges, $availableResources, 'MB');
        $this->validateResource('cpu', $requestedChanges, $availableResources, '%');
        $this->validateResource('allocations', $requestedChanges, $availableResources);
        $this->validateResource('databases', $requestedChanges, $availableResources);
        $this->validateResource('backups', $requestedChanges, $availableResources);
    }

    private function validateResource(string $type, array $changes, array $available, string $unit = ''): void
    {
        if ($changes[$type] > $available[$type]) {
            $message = ucfirst($type) . " change exceeds available resources. ";
            $message .= "You have {$available[$type]}{$unit} remaining.";
            throw new DisplayException($message);
        }
    }
}