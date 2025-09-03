<?php

namespace Pterodactyl\Contracts\Dns;

use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Server;

interface DnsProviderInterface
{
    /**
     * Initialize the provider with configuration.
     */
    public function __construct(array $config);

    /**
     * Test the connection to the DNS provider.
     */
    public function testConnection(): bool;

    /**
     * Create DNS records for a server's subdomain.
     */
    public function createSubdomainRecords(Server $server, Domain $domain): bool;

    /**
     * Update DNS records for a server's subdomain.
     */
    public function updateSubdomainRecords(Server $server, Domain $domain): bool;

    /**
     * Delete DNS records for a server's subdomain.
     */
    public function deleteSubdomainRecords(Server $server, Domain $domain): bool;

    /**
     * Check if a subdomain exists in DNS.
     */
    public function subdomainExists(string $subdomain, Domain $domain): bool;

    /**
     * Get all DNS records for a domain.
     */
    public function getDomainRecords(Domain $domain): array;

    /**
     * Validate the provider configuration.
     */
    public function validateConfig(array $config): array;

    /**
     * Get the provider's display name.
     */
    public function getDisplayName(): string;

    /**
     * Get the required configuration fields for this provider.
     */
    public function getConfigFields(): array;
}