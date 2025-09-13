<?php

namespace Pterodactyl\Services\Subdomain\Features;

use Pterodactyl\Models\Server;
use Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface;

class FactorioSubdomainFeature implements SubdomainFeatureInterface
{
    /**
     * Get the feature name.
     */
    public function getFeatureName(): string
    {
        return 'subdomain_factorio';
    }

    /**
     * Get the DNS records that need to be created for Factorio.
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

        // SRV record for Factorio (_factorio._udp)
        $records[] = [
            'name' => '_factorio._udp.' . $subdomain,
            'type' => 'SRV',
            'content' => [
                'service' => '_factorio',
                'proto' => '_udp',
                'name' => '_factorio._udp.' . $subdomain,
                'priority' => 0,
                'weight' => 0,
                'port' => $port,
                'target' => $fullDomain,
                'content' => "SRV 0 0 {$port} {$fullDomain}",
            ],
            'ttl' => 300,
        ];

        return $records;
    }

}