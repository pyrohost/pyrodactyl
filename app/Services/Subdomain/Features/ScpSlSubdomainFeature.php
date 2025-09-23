<?php

namespace Pterodactyl\Services\Subdomain\Features;

use Pterodactyl\Models\Server;
use Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface;

class ScpSlSubdomainFeature implements SubdomainFeatureInterface
{
    /**
     * Get the feature name.
     */
    public function getFeatureName(): string
    {
        return 'subdomain_scpsl';
    }

    /**
     * Get the DNS records that need to be created for SCP:SL.
     */
    public function getDnsRecords(Server $server, string $subdomain, string $domain): array
    {
        $ip = $server->allocation->ip;
        $port = $server->allocation->port;
        $fullDomain = $subdomain . '.' . $domain;

        $records = [];

        // A record pointing to the server IP
        $records[] = [
            'name' => $subdomain,
            'type' => 'A',
            'content' => $ip,
            'ttl' => 300,
        ];

        // SRV record for SCP:SL (only if not using default port)
        if ($port != 7777) {
            $records[] = [
                'name' => '_scpsl._udp.' . $subdomain,
                'type' => 'SRV',
                'content' => [
                    'service' => '_scpsl',
                    'proto' => '_udp',
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