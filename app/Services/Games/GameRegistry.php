<?php

namespace Pterodactyl\Services\Games;

use Pterodactyl\Services\Games\Presets\MinecraftGamePreset;
use Pterodactyl\Models\Server;

class GameRegistry
{
    private array $presets = [];

    public function __construct()
    {
        $this->registerPresets();
    }

    private function registerPresets(): void
    {
        $this->presets = [
            'minecraft' => new MinecraftGamePreset(),
        ];
    }

    /**
     * Get all registered game presets.
     */
    public function getAll(): array
    {
        return $this->presets;
    }

    /**
     * Get a specific game preset by name.
     */
    public function get(string $name): ?GamePreset
    {
        return $this->presets[$name] ?? null;
    }

    /**
     * Check if a game preset exists.
     */
    public function has(string $name): bool
    {
        return isset($this->presets[$name]);
    }

    /**
     * Get available game presets for a server. All servers support all game types.
     */
    public function getAvailableForServer(Server $server): array
    {
        return array_values($this->presets);
    }

    /**
     * Get game preset for a server based on its current configuration.
     */
    public function getForServer(Server $server): ?GamePreset
    {
        if (!$server->subdomain_type) {
            return null;
        }

        return $this->get($server->subdomain_type);
    }

    /**
     * Register a new game preset.
     */
    public function register(string $name, GamePreset $preset): void
    {
        $this->presets[$name] = $preset;
    }

    /**
     * Get DNS records for a specific game and server.
     */
    public function buildDnsRecords(string $gameName, Server $server): array
    {
        \Illuminate\Support\Facades\Log::info('Building DNS records', [
            'game_name' => $gameName,
            'server_id' => $server->id,
            'subdomain' => $server->subdomain,
            'allocation_id' => $server->allocation_id,
        ]);

        $preset = $this->get($gameName);
        if (!$preset) {
            \Illuminate\Support\Facades\Log::warning('Game preset not found', [
                'game_name' => $gameName,
                'server_id' => $server->id,
                'available_presets' => array_keys($this->presets),
            ]);
            return [];
        }

        $records = [];
        
        // Load allocation relationship if not already loaded
        if (!$server->allocation) {
            $server->load('allocation');
        }
        
        $serverIp = $server->allocation->ip ?? null;
        
        \Illuminate\Support\Facades\Log::info('Server allocation details', [
            'server_id' => $server->id,
            'allocation_id' => $server->allocation_id,
            'server_ip' => $serverIp,
            'server_port' => $server->allocation->port ?? 'null',
            'has_allocation' => !is_null($server->allocation),
        ]);
        
        // Validate IP address
        if (!$serverIp) {
            \Illuminate\Support\Facades\Log::error('No IP address found for server', [
                'server_id' => $server->id,
                'allocation_id' => $server->allocation_id,
                'subdomain' => $server->subdomain,
            ]);
            return [];
        }
        
        // Convert localhost to 127.0.0.1 for consistency
        if ($serverIp === 'localhost') {
            $serverIp = '127.0.0.1';
        }
        
        // Log warning for private IPs but allow them for development
        if ($this->isPrivateIp($serverIp)) {
            \Illuminate\Support\Facades\Log::warning('Using private IP for DNS record - this is for development only', [
                'server_id' => $server->id,
                'ip' => $serverIp,
                'subdomain' => $server->subdomain,
                'message' => 'Private IPs work for development but may not be accessible externally.',
            ]);
        }
        
        $serverPort = $server->allocation->port ?? $preset->getDefaultPort();
        $fullDomain = $server->getFullDomainName();

        \Illuminate\Support\Facades\Log::info('DNS record configuration', [
            'server_id' => $server->id,
            'server_ip' => $serverIp,
            'server_port' => $serverPort,
            'full_domain' => $fullDomain,
            'preset_dns_records' => $preset->getDnsRecords(),
        ]);

        foreach ($preset->getDnsRecords() as $recordConfig) {
            switch ($recordConfig['type']) {
                case 'A':
                    $record = [
                        'type' => 'A',
                        'name' => $server->subdomain,
                        'content' => $serverIp,
                        'ttl' => 300,
                        'proxied' => false, // Don't proxy game server traffic
                    ];
                    $records[] = $record;
                    \Illuminate\Support\Facades\Log::debug('Created A record', $record);
                    break;

                case 'SRV':
                    $service = $recordConfig['service'];
                    $protocol = $recordConfig['protocol'];
                    $priority = $recordConfig['priority'] ?? 0;
                    $weight = $recordConfig['weight'] ?? 5;

                    $record = [
                        'type' => 'SRV',
                        'name' => "{$service}.{$protocol}.{$server->subdomain}",
                        'data' => [
                            'priority' => $priority,
                            'weight' => $weight,
                            'port' => $serverPort,
                            'target' => $fullDomain,
                        ],
                        'ttl' => 300,
                        'proxied' => false, // SRV records cannot be proxied
                    ];
                    $records[] = $record;
                    \Illuminate\Support\Facades\Log::debug('Created SRV record', $record);
                    break;
            }
        }

        \Illuminate\Support\Facades\Log::info('DNS records built successfully', [
            'server_id' => $server->id,
            'record_count' => count($records),
            'records' => $records,
        ]);

        return $records;
    }

    /**
     * Check if an IP address is private/local and shouldn't be used in public DNS.
     */
    private function isPrivateIp(string $ip): bool
    {
        // Check for localhost
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return true;
        }

        // Check for private IP ranges
        $privateRanges = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ];

        foreach ($privateRanges as $range) {
            if ($this->ipInRange($ip, $range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if an IP is within a CIDR range.
     */
    private function ipInRange(string $ip, string $range): bool
    {
        list($subnet, $bits) = explode('/', $range);
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $bits);
        $subnet &= $mask;
        return ($ip & $mask) == $subnet;
    }
}