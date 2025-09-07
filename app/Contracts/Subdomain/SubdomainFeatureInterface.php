<?php

namespace Pterodactyl\Contracts\Subdomain;

use Pterodactyl\Models\Server;

interface SubdomainFeatureInterface
{
    /**
     * Get the feature name (e.g., 'subdomain_minecraft', 'subdomain_rust').
     */
    public function getFeatureName(): string;

    /**
     * Get the DNS records that need to be created for this feature.
     *
     * @param Server $server The server instance
     * @param string $subdomain The subdomain name
     * @param string $domain The domain name
     * @return array Array of DNS record configurations
     */
    public function getDnsRecords(Server $server, string $subdomain, string $domain): array;
}