<?php

namespace Pterodactyl\Services\Subdomain\Features;

use Pterodactyl\Models\Server;
use Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface;

class MinecraftSubdomainFeature implements SubdomainFeatureInterface
{
    /**
     * Get the feature name.
     */
    public function getFeatureName(): string
    {
        return 'subdomain_hytale';
    }

    /**
     * Get the DNS records that need to be created for Minecraft.
     */
    public function getDnsRecords(Server $server, string $subdomain, string $domain): array
    {
        $ip = $server->allocation->ip;
        $port = $server->allocation->port;
        $subdomain_split = explode(".", $subdomain);
        $fullDomain = $subdomain_split[0] . '.' . $domain;

        $records = [];

        // A record pointing to the server IP
        $records[] = [
            'name' => $subdomain,
            'type' => 'A',
            'content' => $ip,
            'ttl' => 300,
        ];

        // SRV record for Hytale (only if not using default port)
        if ($port != 25565) {
            $records[] = [
                'name' => '_hytale._tcp.' . $subdomain,
                'type' => 'SRV',
                'content' => [
                    'service' => '_hytale',
                    'proto' => '_tcp',
                    'name' => $subdomain,
                    'priority' => 0,
                    'weight' => 5,
                    'port' => $port,
                    'target' => $fullDomain,
                    'content' => "SRV 0 5 {$port} {$fullDomain}",
                ],
                'ttl' => 300,
            ];
        }

        return $records;
    }
}

