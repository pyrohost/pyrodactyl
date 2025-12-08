<?php

namespace Pterodactyl\Services\Subdomain\Features;

use Pterodactyl\Models\Server;
use Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface;

class VintageStorySubdomainFeature implements SubdomainFeatureInterface
{
    // The default Vintage Story port
    protected const DEFAULT_PORT = 42420;

    /**
     * Get the feature name.
     */
    public function getFeatureName(): string
    {
        return 'subdomain_vintagestory';
    }

    /**
     * Get the DNS records that need to be created for Vintage Story.
     */
    public function getDnsRecords(Server $server, string $subdomain, string $domain): array
    {
        $ip = $server->allocation->ip;
        $port = $server->allocation->port;
        // This logic seems specific to how your Pterodactyl setup calculates the target domain
        $subdomain_split = explode(".", $subdomain);
        $fullDomain = $subdomain_split[0] . '.' . $domain;

        $records = [];

        // 1. A record pointing to the server IP (Required for the SRV Target)
        $records[] = [
            'name' => $subdomain,
            'type' => 'A',
            'content' => $ip,
            'ttl' => 300,
        ];

        // 2. SRV record for Vintage Story (only if not using the default port 42420)
        if ($port != self::DEFAULT_PORT) {
            $records[] = [
                // The name uses the Vintage Story service identifier: _vintagestory._tcp.
                'name' => '_vintagestory._tcp.' . $subdomain,
                'type' => 'SRV',
                'content' => [
                    'service' => '_vintagestory',
                    'proto' => '_tcp',
                    'name' => $subdomain,
                    'priority' => 0,
                    'weight' => 5,
                    'port' => $port,
                    'target' => $fullDomain,
                    // The content must be formatted as: SRV priority weight port target
                    'content' => "SRV 0 5 {$port} {$fullDomain}",
                ],
                'ttl' => 300,
            ];
        }

        return $records;
    }
}
