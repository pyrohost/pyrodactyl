<?php

namespace Pterodactyl\Services\Domains;

use Pterodactyl\Models\Domain;
use Pterodactyl\Services\Dns\DnsManager;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Support\Facades\Log;

class DomainCreationService
{
    public function __construct(
        private DnsManager $dnsManager
    ) {
    }

    /**
     * Create a new domain and validate DNS provider configuration.
     *
     * @throws DisplayException
     */
    public function handle(array $data): Domain
    {
        // Validate DNS provider configuration
        $errors = $this->dnsManager->validateProviderConfig($data['dns_provider'], $data['dns_config']);
        
        if (!empty($errors)) {
            throw new DisplayException('DNS configuration validation failed: ' . implode(', ', $errors));
        }

        // Create the domain
        $domain = Domain::create($data);

        // Test the DNS connection
        if (!$this->dnsManager->testConnection($domain)) {
            // If connection fails, still create the domain but mark it as inactive
            $domain->update([
                'is_active' => false,
                'sync_status' => [
                    'status' => 'error',
                    'message' => 'DNS connection test failed during creation',
                    'timestamp' => now()->toISOString(),
                ],
            ]);

            Log::warning('Domain created but DNS connection failed', [
                'domain_id' => $domain->id,
                'domain_name' => $domain->name,
                'provider' => $domain->dns_provider,
            ]);

            throw new DisplayException('Domain was created but DNS connection test failed. Please check your DNS configuration.');
        }

        // Update sync status on successful connection
        $domain->update([
            'last_sync_at' => now(),
            'sync_status' => [
                'status' => 'success',
                'message' => 'Domain created and DNS connection verified',
                'timestamp' => now()->toISOString(),
            ],
        ]);

        Log::info('Domain created successfully', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'provider' => $domain->dns_provider,
        ]);

        return $domain;
    }
}