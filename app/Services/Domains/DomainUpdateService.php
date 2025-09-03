<?php

namespace Pterodactyl\Services\Domains;

use Pterodactyl\Models\Domain;
use Pterodactyl\Services\Dns\DnsManager;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Support\Facades\Log;

class DomainUpdateService
{
    public function __construct(
        private DnsManager $dnsManager
    ) {
    }

    /**
     * Update a domain and validate DNS provider configuration.
     *
     * @throws DisplayException
     */
    public function handle(Domain $domain, array $data): Domain
    {
        $originalData = [
            'dns_provider' => $domain->dns_provider,
            'dns_config' => $domain->dns_config,
        ];

        // Validate DNS provider configuration if it has changed
        if ($data['dns_provider'] !== $domain->dns_provider || $data['dns_config'] !== $domain->dns_config) {
            $errors = $this->dnsManager->validateProviderConfig($data['dns_provider'], $data['dns_config']);
            
            if (!empty($errors)) {
                throw new DisplayException('DNS configuration validation failed: ' . implode(', ', $errors));
            }
        }

        // Update the domain
        $domain->update($data);

        // Test DNS connection if DNS configuration changed
        if ($data['dns_provider'] !== $originalData['dns_provider'] || $data['dns_config'] !== $originalData['dns_config']) {
            if (!$this->dnsManager->testConnection($domain)) {
                // Revert changes if connection fails
                $domain->update($originalData);
                
                throw new DisplayException('DNS connection test failed. Changes have been reverted.');
            }

            // Update sync status on successful connection
            $domain->update([
                'last_sync_at' => now(),
                'sync_status' => [
                    'status' => 'success',
                    'message' => 'Domain updated and DNS connection verified',
                    'timestamp' => now()->toISOString(),
                ],
            ]);

            Log::info('Domain DNS configuration updated successfully', [
                'domain_id' => $domain->id,
                'domain_name' => $domain->name,
                'old_provider' => $originalData['dns_provider'],
                'new_provider' => $data['dns_provider'],
            ]);

            // If the domain has servers with subdomains, sync their DNS records
            $this->syncExistingSubdomains($domain);
        }

        Log::info('Domain updated successfully', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
        ]);

        return $domain;
    }

    /**
     * Sync DNS records for existing subdomains when domain DNS config changes.
     */
    private function syncExistingSubdomains(Domain $domain): void
    {
        $servers = $domain->servers()->whereNotNull('subdomain')->get();
        
        if ($servers->isEmpty()) {
            return;
        }

        Log::info('Syncing DNS records for existing subdomains', [
            'domain_id' => $domain->id,
            'server_count' => $servers->count(),
        ]);

        $syncSuccess = true;
        
        foreach ($servers as $server) {
            try {
                if (!$this->dnsManager->createSubdomainRecords($server)) {
                    $syncSuccess = false;
                    Log::warning('Failed to sync DNS records for server', [
                        'server_id' => $server->id,
                        'subdomain' => $server->subdomain,
                    ]);
                }
            } catch (\Exception $e) {
                $syncSuccess = false;
                Log::error('Exception while syncing DNS records for server', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Update domain sync status based on results
        $status = $syncSuccess ? 'success' : 'partial';
        $message = $syncSuccess 
            ? 'All existing subdomain DNS records synchronized successfully'
            : 'Some subdomain DNS records failed to synchronize';

        $domain->update([
            'sync_status' => [
                'status' => $status,
                'message' => $message,
                'timestamp' => now()->toISOString(),
            ],
        ]);
    }
}