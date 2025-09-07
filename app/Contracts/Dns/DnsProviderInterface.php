<?php

namespace Pterodactyl\Contracts\Dns;

interface DnsProviderInterface
{
    /**
     * Test the connection to the DNS provider.
     *
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function testConnection(): bool;

    /**
     * Create a DNS record.
     *
     * @param string $domain The domain name
     * @param string $name The record name (subdomain or full name for SRV)
     * @param string $type The record type (A, SRV, CNAME, etc.)
     * @param string|array $content The record content (IP for A, structured data for SRV)
     * @param int $ttl Time to live in seconds
     * @return string The created record ID
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string;

    /**
     * Update a DNS record.
     *
     * @param string $domain The domain name
     * @param string $recordId The record ID to update
     * @param string|array $content The new record content
     * @param int|null $ttl Optional new TTL
     * @return bool True if successful
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool;

    /**
     * Delete a DNS record.
     *
     * @param string $domain The domain name
     * @param string $recordId The record ID to delete
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function deleteRecord(string $domain, string $recordId): void;

    /**
     * Get a specific DNS record.
     *
     * @param string $domain The domain name
     * @param string $recordId The record ID
     * @return array The DNS record data
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function getRecord(string $domain, string $recordId): array;

    /**
     * List existing DNS records for a domain.
     *
     * @param string $domain The domain name
     * @param string|null $name Filter by record name (optional)
     * @param string|null $type Filter by record type (optional)
     * @return array Array of DNS records
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array;

    /**
     * Get the configuration schema for this provider.
     *
     * @return array Array of configuration fields and their requirements
     */
    public function getConfigurationSchema(): array;

    /**
     * Validate the provider configuration.
     *
     * @param array $config The configuration to validate
     * @return bool True if valid
     * @throws \Pterodactyl\Exceptions\Dns\DnsProviderException
     */
    public function validateConfiguration(array $config): bool;

    /**
     * Get the supported record types for this provider.
     *
     * @return array Array of supported DNS record types
     */
    public function getSupportedRecordTypes(): array;
}