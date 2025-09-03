<?php

namespace Pterodactyl\Services\Dns;

use Exception;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Services\Dns\CloudflareDnsProvider;

class DnsManager
{
    private array $providers = [];

    public function __construct()
    {
        $this->registerProviders();
    }

    /**
     * Register available DNS providers.
     */
    private function registerProviders(): void
    {
        $this->providers = [
            'cloudflare' => CloudflareDnsProvider::class,
        ];
    }

    /**
     * Get a DNS provider instance for a domain.
     */
    public function getProvider(Domain $domain): DnsProviderInterface
    {
        $providerClass = $this->providers[$domain->dns_provider] ?? null;
        
        if (!$providerClass) {
            throw new Exception("Unsupported DNS provider: {$domain->dns_provider}");
        }

        if (!class_exists($providerClass)) {
            throw new Exception("DNS provider class not found: {$providerClass}");
        }

        return new $providerClass($domain->dns_config);
    }

    /**
     * Test connection to a DNS provider.
     */
    public function testConnection(Domain $domain): bool
    {
        try {
            $provider = $this->getProvider($domain);
            return $provider->testConnection();
        } catch (Exception $e) {
            Log::error('DNS connection test failed', [
                'domain_id' => $domain->id,
                'provider' => $domain->dns_provider,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Create DNS records for a server's subdomain.
     */
    public function createSubdomainRecords(Server $server): bool
    {
        if (!$server->domain) {
            return false;
        }

        try {
            $provider = $this->getProvider($server->domain);
            return $provider->createSubdomainRecords($server, $server->domain);
        } catch (Exception $e) {
            Log::error('Failed to create subdomain DNS records', [
                'server_id' => $server->id,
                'domain_id' => $server->domain_id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update DNS records for a server's subdomain.
     */
    public function updateSubdomainRecords(Server $server): bool
    {
        if (!$server->domain) {
            return false;
        }

        try {
            $provider = $this->getProvider($server->domain);
            return $provider->updateSubdomainRecords($server, $server->domain);
        } catch (Exception $e) {
            Log::error('Failed to update subdomain DNS records', [
                'server_id' => $server->id,
                'domain_id' => $server->domain_id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Delete DNS records for a server's subdomain.
     */
    public function deleteSubdomainRecords(Server $server): bool
    {
        if (!$server->domain) {
            return false;
        }

        try {
            $provider = $this->getProvider($server->domain);
            return $provider->deleteSubdomainRecords($server, $server->domain);
        } catch (Exception $e) {
            Log::error('Failed to delete subdomain DNS records', [
                'server_id' => $server->id,
                'domain_id' => $server->domain_id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Check if a subdomain exists in DNS.
     */
    /**
     * Get all available DNS providers.
     */
    public function getAvailableProviders(): array
    {
        $providers = [];
        
        foreach ($this->providers as $key => $class) {
            if (class_exists($class)) {
                $instance = new $class([]);
                $providers[$key] = [
                    'name' => $instance->getDisplayName(),
                    'config_fields' => $instance->getConfigFields(),
                ];
            }
        }

        return $providers;
    }

    /**
     * Validate DNS provider configuration.
     */
    public function validateProviderConfig(string $provider, array $config): array
    {
        $providerClass = $this->providers[$provider] ?? null;
        
        if (!$providerClass || !class_exists($providerClass)) {
            return ['Invalid DNS provider'];
        }

        $instance = new $providerClass([]);
        return $instance->validateConfig($config);
    }