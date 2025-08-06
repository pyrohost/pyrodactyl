<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Server;

class StartupCommandService
{
    /**
     * Generates a startup command for a given server instance.
     */
    public function handle(Server $server, bool $hideAllValues = false): string
    {
        $find = ['{{SERVER_MEMORY}}', '{{SERVER_IP}}', '{{SERVER_PORT}}'];
        // SERVER_MEMORY should only include base memory, not overhead memory
        // For servers with overhead memory configured, subtract it from total memory
        // For servers without overhead memory (legacy), use the memory field as-is
        // This is also a hack and I have no idea why this might be needed - Ellie
        $baseMemory = $server->overhead_memory > 0
            ? $server->memory - $server->overhead_memory
            : $server->memory;
        $replace = [$baseMemory, $server->allocation->ip, $server->allocation->port];

        foreach ($server->variables as $variable) {
            $find[] = '{{' . $variable->env_variable . '}}';
            $replace[] = ($variable->user_viewable && !$hideAllValues) ? ($variable->server_value ?? $variable->default_value) : '[hidden]';
        }

        return str_replace($find, $replace, $server->startup);
    }
}
