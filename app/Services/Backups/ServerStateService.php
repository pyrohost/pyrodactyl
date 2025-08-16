<?php

namespace Pterodactyl\Services\Backups;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Backup;
use Illuminate\Support\Collection;
use Illuminate\Database\ConnectionInterface;

class ServerStateService
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {
    }

    /**
     * Captures the current server state for backup.
     * This includes nest_id, egg_id, startup command, docker image, and all configured variables.
     */
    public function captureServerState(Server $server): array
    {
        // Load server with relationships needed for state capture
        $server->load(['variables', 'egg', 'nest']);

        // Capture basic server configuration
        $state = [
            'nest_id' => $server->nest_id,
            'egg_id' => $server->egg_id,
            'startup' => $server->startup,
            'image' => $server->image,
            'captured_at' => now()->toISOString(),
        ];

        // Capture all server variables with their current values
        $variables = [];
        foreach ($server->variables as $variable) {
            $variables[] = [
                'variable_id' => $variable->id,
                'env_variable' => $variable->env_variable,
                'name' => $variable->name,
                'description' => $variable->description,
                'default_value' => $variable->default_value,
                'user_viewable' => $variable->user_viewable,
                'user_editable' => $variable->user_editable,
                'rules' => $variable->rules,
                'server_value' => $variable->server_value, // Current configured value
            ];
        }
        $state['variables'] = $variables;

        // Capture egg information for reference
        if ($server->egg) {
            $state['egg_info'] = [
                'name' => $server->egg->name,
                'description' => $server->egg->description,
                'uuid' => $server->egg->uuid,
                'docker_images' => $server->egg->docker_images,
            ];
        }

        // Capture nest information for reference
        if ($server->nest) {
            $state['nest_info'] = [
                'name' => $server->nest->name,
                'description' => $server->nest->description,
                'uuid' => $server->nest->uuid,
            ];
        }

        return $state;
    }

    /**
     * Restores server state from a backup.
     * This will update the server's configuration to match the backup state.
     */
    public function restoreServerState(Server $server, Backup $backup): void
    {
        if (empty($backup->server_state)) {
            // Backup doesn't contain server state (backward compatibility)
            return;
        }

        $state = $backup->server_state;

        $this->connection->transaction(function () use ($server, $state) {
            // Update basic server configuration
            $serverUpdates = [];
            
            if (isset($state['nest_id'])) {
                $serverUpdates['nest_id'] = $state['nest_id'];
            }
            
            if (isset($state['egg_id'])) {
                $serverUpdates['egg_id'] = $state['egg_id'];
            }
            
            if (isset($state['startup'])) {
                $serverUpdates['startup'] = $state['startup'];
            }
            
            if (isset($state['image'])) {
                $serverUpdates['image'] = $state['image'];
            }

            if (!empty($serverUpdates)) {
                $server->update($serverUpdates);
            }

            // Restore server variables
            if (isset($state['variables']) && is_array($state['variables'])) {
                $this->restoreServerVariables($server, $state['variables']);
            }
        });
    }

    /**
     * Restores server variables from backup state.
     */
    private function restoreServerVariables(Server $server, array $variables): void
    {
        // First, clear existing server variables to ensure clean state
        $this->connection->table('server_variables')
            ->where('server_id', $server->id)
            ->delete();

        // Restore variables from backup state
        foreach ($variables as $variable) {
            if (!isset($variable['env_variable'], $variable['server_value'])) {
                continue; // Skip invalid variable data
            }

            // Find the current egg variable by environment variable name
            // We use env_variable as the key since variable IDs might have changed
            $currentEggVariable = $this->connection->table('egg_variables')
                ->where('egg_id', $server->egg_id)
                ->where('env_variable', $variable['env_variable'])
                ->first();

            if ($currentEggVariable) {
                // Insert server variable with the restored value
                $this->connection->table('server_variables')->insert([
                    'server_id' => $server->id,
                    'variable_id' => $currentEggVariable->id,
                    'variable_value' => $variable['server_value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Validates if the server state can be restored.
     * Checks if the target nest and egg still exist.
     */
    public function validateRestoreCompatibility(Backup $backup): array
    {
        $warnings = [];
        $errors = [];

        if (empty($backup->server_state)) {
            return ['warnings' => [], 'errors' => []];
        }

        $state = $backup->server_state;

        // Check if nest still exists
        if (isset($state['nest_id'])) {
            $nestExists = $this->connection->table('nests')
                ->where('id', $state['nest_id'])
                ->exists();
            
            if (!$nestExists) {
                $nestName = $state['nest_info']['name'] ?? 'Unknown';
                $errors[] = "Nest '{$nestName}' (ID: {$state['nest_id']}) no longer exists.";
            }
        }

        // Check if egg still exists
        if (isset($state['egg_id'])) {
            $eggExists = $this->connection->table('eggs')
                ->where('id', $state['egg_id'])
                ->exists();
            
            if (!$eggExists) {
                $eggName = $state['egg_info']['name'] ?? 'Unknown';
                $errors[] = "Egg '{$eggName}' (ID: {$state['egg_id']}) no longer exists.";
            }
        }

        // Check for missing variables
        if (isset($state['variables']) && is_array($state['variables'])) {
            $missingVariables = [];
            
            foreach ($state['variables'] as $variable) {
                if (!isset($variable['env_variable'])) continue;
                
                $exists = $this->connection->table('egg_variables')
                    ->where('egg_id', $state['egg_id'] ?? 0)
                    ->where('env_variable', $variable['env_variable'])
                    ->exists();
                
                if (!$exists) {
                    $missingVariables[] = $variable['name'] ?? $variable['env_variable'];
                }
            }
            
            if (!empty($missingVariables)) {
                $warnings[] = 'Some variables from the backup no longer exist in the current egg: ' . implode(', ', $missingVariables);
            }
        }

        return [
            'warnings' => $warnings,
            'errors' => $errors,
        ];
    }

    /**
     * Checks if a backup has server state data.
     */
    public function hasServerState(Backup $backup): bool
    {
        return !empty($backup->server_state);
    }

    /**
     * Gets a summary of the server state for display purposes.
     */
    public function getStateSummary(Backup $backup): ?array
    {
        if (!$this->hasServerState($backup)) {
            return null;
        }

        $state = $backup->server_state;
        
        return [
            'nest_name' => $state['nest_info']['name'] ?? 'Unknown',
            'egg_name' => $state['egg_info']['name'] ?? 'Unknown',
            'image' => $state['image'] ?? 'Unknown',
            'variables_count' => count($state['variables'] ?? []),
            'captured_at' => $state['captured_at'] ?? null,
        ];
    }
}