<?php

namespace Pterodactyl\Services\Subdomain;

use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerSubdomain;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Enums\Subdomain\Features;

class SubdomainManagementService
{
    private array $dnsProviders = [];
    private array $subdomainFeatures = [];

    public function __construct()
    {
        // Register DNS providers
        $this->dnsProviders = Providers::all();

        // Register subdomain features
        $this->subdomainFeatures = Features::all();
    }

    /**
     * Create a subdomain for a server
     *
     * @param Server $server
     * @param Domain $domain
     * @param string $subdomain
     * @return ServerSubdomain
     * @throws \Exception
     */
    public function createSubdomain(Server $server, Domain $domain, string $subdomain): ?ServerSubdomain
    {
        // Check if server supports subdomains
        $feature = $this->getServerSubdomainFeature($server);
        if (!$feature) {
            throw new \Exception('Server does not support subdomains.');
        }

        // Validate subdomain
        $this->validateSubdomain($subdomain, $feature, $domain);
        $dnsRecord = $this->createDnsRecord($subdomain, $domain);

        // Get DNS provider
        try {
            $dnsProvider = $this->getDnsProvider($domain);
        } catch (\Exception $e) {
            throw new \Exception('DNS service temporarily unavailable.');
        }

        // Get DNS records to create
        $newDomain = $this->createDnsRecord($subdomain, $domain->name);
        $dnsRecords = $feature->getDnsRecords($server, $newDomain, $domain->name);

        // Normalize IP addresses in DNS records
        $dnsRecords = $this->normalizeIpAddresses($dnsRecords, $server);


        // Use database transaction for consistency
        return DB::transaction(function () use ($server, $domain, $subdomain, $feature, $dnsProvider, $dnsRecords) {
            // CRITICAL: Check if server already has an active subdomain (prevents race conditions)
            $existingServerSubdomain = ServerSubdomain::where('server_id', $server->id)
                ->where('is_active', true)
                ->lockForUpdate() // Use row-level locking to prevent race conditions
                ->first();

            if ($existingServerSubdomain) {
                throw new \Exception('Server already has an active subdomain. Please delete it first.');
            }

            // Double-check subdomain availability within transaction
            $existing = ServerSubdomain::where('domain_id', $domain->id)
                ->where('subdomain', $subdomain)
                ->where('is_active', true)
                ->first();

            if ($existing) {
                throw new \Exception('Subdomain is not available.');
            }

            // Create DNS records first
            $createdRecordIds = [];
            $rollbackRequired = false;

            try {
                foreach ($dnsRecords as $record) {
                    $recordId = $dnsProvider->createRecord(
                        $domain->name,
                        $record['name'],
                        $record['type'],
                        $record['content'],
                        $record['ttl'] ?? 300
                    );
                    $createdRecordIds[] = $recordId;
                }

                // Create subdomain record in database
                $serverSubdomain = ServerSubdomain::create([
                    'server_id' => $server->id,
                    'domain_id' => $domain->id,
                    'subdomain' => $subdomain,
                    'record_type' => str_replace('subdomain_', '', $feature->getFeatureName()),
                    'dns_records' => $createdRecordIds,
                    'is_active' => true,
                ]);

                return $serverSubdomain;
            } catch (\Exception $e) {
                $rollbackRequired = true;
                throw $e;
            } finally {
                // Clean up DNS records if transaction failed
                if ($rollbackRequired && !empty($createdRecordIds)) {
                    $this->cleanupDnsRecords($dnsProvider, $domain->name, $createdRecordIds);
                }
            }
        });
    }

    /**
     * Update a subdomain's DNS records
     *
     * @param ServerSubdomain $serverSubdomain
     * @return void
     * @throws \Exception
     */
    public function updateSubdomain(ServerSubdomain $serverSubdomain): void
    {
        $server = $serverSubdomain->server;
        $domain = $serverSubdomain->domain;

        $feature = $this->getServerSubdomainFeature($server);
        if (!$feature) {
            throw new \Exception('Server no longer supports subdomains.');
        }

        try {
            $dnsProvider = $this->getDnsProvider($domain);
        } catch (\Exception $e) {
            throw new \Exception('DNS service temporarily unavailable.');
        }

        $newDnsRecords = $feature->getDnsRecords($server, $serverSubdomain->subdomain, $domain->name);
        $newDnsRecords = $this->normalizeIpAddresses($newDnsRecords, $server);

        DB::transaction(function () use ($serverSubdomain, $dnsProvider, $domain, $newDnsRecords) {
            $recordIds = $serverSubdomain->dns_records;
            $updatedRecordIds = [];
            $rollbackData = [];

            try {
                // Update/create records
                foreach ($newDnsRecords as $index => $record) {
                    if (isset($recordIds[$index])) {
                        // Store original state for potential rollback
                        try {
                            $originalRecord = $dnsProvider->getRecord($domain->name, $recordIds[$index]);
                            $rollbackData[$recordIds[$index]] = $originalRecord;
                        } catch (\Exception $e) {
                            // If we can't get original record, we can't rollback safely
                            Log::warning("Cannot retrieve original DNS record for rollback: {$recordIds[$index]}");
                        }

                        // Update existing record
                        $dnsProvider->updateRecord(
                            $domain->name,
                            $recordIds[$index],
                            $record['content'],
                            $record['ttl'] ?? null
                        );
                        $updatedRecordIds[] = $recordIds[$index];
                    } else {
                        // Create new record if needed
                        $recordId = $dnsProvider->createRecord(
                            $domain->name,
                            $record['name'],
                            $record['type'],
                            $record['content'],
                            $record['ttl'] ?? 300
                        );
                        $updatedRecordIds[] = $recordId;
                    }
                }

                // Delete any extra records
                $recordsToDelete = array_slice($recordIds, count($newDnsRecords));
                foreach ($recordsToDelete as $recordId) {
                    $dnsProvider->deleteRecord($domain->name, $recordId);
                }

                // Update database record
                $serverSubdomain->update([
                    'dns_records' => $updatedRecordIds,
                ]);
            } catch (\Exception $e) {
                // Attempt rollback of DNS changes
                $this->rollbackDnsChanges($dnsProvider, $domain->name, $rollbackData, $updatedRecordIds);
                throw new \Exception('Failed to update subdomain DNS records.');
            }
        });
    }

    /**
     * Delete a subdomain and its DNS records
     *
     * @param ServerSubdomain $serverSubdomain
     * @return void
     * @throws \Exception
     */
    public function deleteSubdomain(ServerSubdomain $serverSubdomain): void
    {
        $domain = $serverSubdomain->domain;

        DB::transaction(function () use ($serverSubdomain, $domain) {
            $dnsRecordsToDelete = $serverSubdomain->dns_records ?? [];

            try {
                // First, mark as inactive in database to prevent new operations
                $serverSubdomain->update(['is_active' => false]);

                // Try to delete DNS records if provider is available
                if (!empty($dnsRecordsToDelete)) {
                    try {
                        $dnsProvider = $this->getDnsProvider($domain);

                        // Delete DNS records - don't fail the entire operation if some DNS deletions fail
                        foreach ($dnsRecordsToDelete as $recordId) {
                            try {
                                $dnsProvider->deleteRecord($domain->name, $recordId);
                            } catch (\Exception $e) {
                                Log::warning("Failed to delete DNS record {$recordId} during subdomain deletion: {$e->getMessage()}");
                            }
                        }
                    } catch (\Exception $e) {
                        // DNS provider unavailable, log and continue with database deletion
                        Log::warning("DNS provider unavailable during subdomain deletion for {$serverSubdomain->full_domain}: {$e->getMessage()}");
                    }
                }

                // Delete database record - this should always succeed after marking inactive
                $serverSubdomain->delete();
            } catch (\Exception $e) {
                Log::error("Failed to delete subdomain {$serverSubdomain->full_domain}: {$e->getMessage()}");
                throw new \Exception('Failed to delete subdomain completely.');
            }
        });
    }

    /**
     * Get available domains for subdomain creation.
     * Only returns safe data needed by the frontend.
     *
     * @return array
     */
    public function getAvailableDomains(): array
    {
        return Domain::where('is_active', true)
            ->select(['id', 'name', 'is_active', 'is_default'])
            ->get()
            ->map(function ($domain) {
                return [
                    'id' => $domain->id,
                    'name' => $domain->name,
                    'is_active' => $domain->is_active,
                    'is_default' => $domain->is_default,
                ];
            })
            ->toArray();
    }

    /**
     * Check if a subdomain is available for use.
     *
     * @param string $subdomain
     * @param Domain $domain
     * @param Server|null $excludeServer Exclude this server's subdomain from availability check
     * @return array
     */
    public function checkSubdomainAvailability(string $subdomain, Domain $domain, ?Server $excludeServer = null): array
    {
        $subdomain = strtolower(trim($subdomain));

        if (in_array($subdomain, $this->getReservedSubdomains())) {
            return [
                'available' => false,
                'message' => 'This subdomain is reserved and cannot be used.',
            ];
        }

        if (empty($subdomain)) {
            return [
                'available' => false,
                'message' => 'Subdomain cannot be empty.',
            ];
        }

        if (strlen($subdomain) > 63) {
            return [
                'available' => false,
                'message' => 'Subdomain cannot be longer than 63 characters.',
            ];
        }

        if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $subdomain)) {
            return [
                'available' => false,
                'message' => 'Subdomain contains invalid characters.',
            ];
        }

        if (preg_match('/[<>"\']/', $subdomain)) {
            return [
                'available' => false,
                'message' => 'Subdomain contains invalid characters.',
            ];
        }

        $query = ServerSubdomain::where('domain_id', $domain->id)
            ->where('subdomain', $subdomain)
            ->where('is_active', true);

        if ($excludeServer) {
            $query->where('server_id', '!=', $excludeServer->id);
        }

        $existing = $query->exists();

        return [
            'available' => !$existing,
            'message' => $existing ? 'Subdomain is not available.' : 'Subdomain is available.',
        ];
    }

    /**
     * Get the list of reserved subdomains.
     *
     * @return array
     */
    public function getReservedSubdomains(): array
    {
        //? I used ChatGPT to generate this list based on common reserved subdomains
        //? AND I AM PROUD - ellie

        return array_map('strtolower', [
            // Web & infra
            'www',
            'web',
            'origin',
            'edge',
            'cdn',
            'static',
            'assets',
            'files',
            'media',
            'img',
            'images',
            'downloads',
            'dl',

            // Email & DNS
            'mail',
            'webmail',
            'smtp',
            'imap',
            'pop',
            'pop3',
            'mx',
            'dns',
            'ns',
            'autodiscover',
            'autoconfig',
            'mta-sts',
            'openpgpkey',

            // Admin & control planes
            'admin',
            'administrator',
            'root',
            'sysadmin',
            'panel',
            'cp',
            'cpanel',
            'whm',
            'webdisk',
            'status',
            'monitor',
            'monitoring',
            'health',
            'uptime',
            'metrics',
            'logs',
            'logging',

            // Auth & accounts
            'login',
            'signin',
            'sign-in',
            'signup',
            'sign-up',
            'register',
            'account',
            'accounts',
            'auth',
            'oauth',
            'oauth2',
            'sso',
            'id',
            'identity',
            'secure',
            'passwd',
            'password',

            // APIs & developer endpoints
            'api',
            'apis',
            'dev',
            'development',
            'test',
            'testing',
            'qa',
            'stage',
            'staging',
            'preprod',
            'preview',
            'sandbox',
            'prod',
            'production',
            'demo',

            // Commerce / portals / docs
            'billing',
            'invoice',
            'invoices',
            'payments',
            'pay',
            'store',
            'shop',
            'support',
            'help',
            'docs',
            'documentation',
            'wiki',
            'portal',
            'dashboard',

            // File transfer
            'ftp',
            'sftp',
            'tftp',

            // CI/CD & tooling often probed by scanners
            'git',
            'github',
            'gitlab',
            'gitea',
            'forgejo',
            'bitbucket',
            'hg',
            'svn',
            'jenkins',
            'grafana',
            'prometheus',
            'kibana',
            'elastic',
            'sonarqube',
            'nexus',

            // Misc safety
            'localhost',
            'local',
            'loopback',
            'default',
            'undefined',
            'null',
        ]);
    }

    /**
     * Get the subdomain feature for a server.
     *
     * @return null|\Pterodactyl\Contracts\Subdomain\SubdomainFeatureInterface
     */
    public function getServerSubdomainFeature(Server $server): ?SubdomainFeatureInterface
    {
        if (!$server->egg) {
            return null;
        }

        // Check in egg's direct features
        if (is_array($server->egg->features)) {
            foreach ($server->egg->features as $featureName) {
                if (isset($this->subdomainFeatures[$featureName])) {
                    $featureClass = $this->subdomainFeatures[$featureName];
                    return new $featureClass();
                }
            }
        }

        // Check in inherited features
        if (is_array($server->egg->inherit_features)) {
            foreach ($server->egg->inherit_features as $featureName) {
                if (isset($this->subdomainFeatures[$featureName])) {
                    $featureClass = $this->subdomainFeatures[$featureName];
                    return new $featureClass();
                }
            }
        }

        return null;
    }

    /**
     * Validate a subdomain name.
     *
     * @param string $subdomain
     * @param SubdomainFeatureInterface $feature
     * @param Domain $domain
     * @return void
     * @throws \Exception
     */
    private function validateSubdomain(string $subdomain, SubdomainFeatureInterface $feature, Domain $domain): void
    {
        $availabilityResult = $this->checkSubdomainAvailability($subdomain, $domain, null);

        if (!$availabilityResult['available']) {
            throw new \Exception($availabilityResult['message']);
        }
    }

    /**
     * Get the DNS provider for a domain.
     *
     * @param Domain $domain
     * @return \Pterodactyl\Contracts\Dns\DnsProviderInterface
     * @throws \Exception
     */
    private function getDnsProvider(Domain $domain): DnsProviderInterface
    {
        $providerName = $domain->dns_provider;

        if (!isset($this->dnsProviders[$providerName])) {
            throw new \Exception("Unsupported DNS provider: {$providerName}");
        }

        $providerClass = $this->dnsProviders[$providerName];
        return new $providerClass($domain->dns_config);
    }

    /**
     * Clean up DNS records in case of failure.
     *
     * @param DnsProviderInterface $dnsProvider
     * @param string $domain
     * @param array $recordIds
     * @return void
     */
    private function cleanupDnsRecords(DnsProviderInterface $dnsProvider, string $domain, array $recordIds): void
    {
        foreach ($recordIds as $recordId) {
            try {
                $dnsProvider->deleteRecord($domain, $recordId);
            } catch (\Exception $cleanupException) {
                Log::error("Failed to cleanup DNS record {$recordId} for domain {$domain} during rollback");
            }
        }
    }

    /**
     * Attempt to rollback DNS changes during update failures.
     *
     * @param DnsProviderInterface $dnsProvider
     * @param string $domain
     * @param array $rollbackData
     * @param array $createdRecordIds
     * @return void
     */
    private function rollbackDnsChanges(DnsProviderInterface $dnsProvider, string $domain, array $rollbackData, array $createdRecordIds): void
    {
        // Rollback updated records to original state
        foreach ($rollbackData as $recordId => $originalRecord) {
            try {
                $dnsProvider->updateRecord(
                    $domain,
                    $recordId,
                    $originalRecord['content'] ?? $originalRecord['data'] ?? '',
                    $originalRecord['ttl'] ?? null
                );
            } catch (\Exception $e) {
                Log::error("Failed to rollback DNS record {$recordId} during update failure");
            }
        }

        // Delete any newly created records
        $this->cleanupDnsRecords($dnsProvider, $domain, array_diff($createdRecordIds, array_keys($rollbackData)));
    }

    /**
     * Normalize IP addresses in DNS records (convert localhost to 127.0.0.1).
     * Or if using ip_aliases convert to the correct ip
     *
     * @param array $dnsRecords
     * @return array
     */
    private function normalizeIpAddresses(array $dnsRecords, server $server): array
    {
        $useAlias = $server->node->trust_alias;
        foreach ($dnsRecords as &$record) {
            if ($useAlias == 1) {
                $record['content'] = $server->allocation->ip_alias;
            } else if ($record['type'] === 'A' && isset($record['content']) && $useAlias == 0) {
                // Convert localhost to 127.0.0.1 for A records
                if (strtolower($record['content']) === 'localhost' &&  $useAlias == 0) {
                    $record['content'] = '127.0.0.1';
                }
            }
        }
        return $dnsRecords;
    }


    private static function getDnsSubdomainHierarchy($domain)
    {
        /**
         * Get the subdomain hierarchy for DNS record creation
         *
         * For 'servers.pyrodactyl.dev' returns 'servers'
         * For 'api.v1.service.github.io' returns 'api.v1.service'
         * For 'www.example.com' returns 'www'
         * For 'example.com' returns ''
         */

        $cleanDomain = parse_url($domain, PHP_URL_HOST) ?: $domain;
        $parts = explode('.', $cleanDomain);
        $partCount = count($parts);

        if ($partCount < 2) {
            return ['error' => 'Invalid domain format'];
        }

        if ($partCount > 2) {
            $subdomainParts = array_slice($parts, 0, $partCount - 2);
            return implode('.', $subdomainParts);
        }

        return '';
    }

    public function createDnsRecord($serverName, $domain)
    {
        /**
         * Create DNS record in the format: servername.subdomain_hierarchy
         */

        $subdomainHierarchy = $this->getDnsSubdomainHierarchy($domain);

        if ($subdomainHierarchy === '') {
            return $serverName;
        } else {
            return $serverName . '.' . $subdomainHierarchy;
        }
    }
}


# TODO: Move these to dedicated test in the test suite
/* $testCases = [ */
/*     ['servername', 'servers.pyrodactyl.dev'], */
/*     ['node1', 'api.v1.service.github.io'], */
/*     ['web01', 'www.example.com'], */
/*     ['db01', 'example.com'], */
/*     ['app', 'staging.app.company.co.uk'],  # TODO: This one is a doozy and returns "DNS Record: app.staging.app.company" instead of "DNS Record: app.staging.app" due to DAMN TLDS!!! */
/* ]; */
/**/
/* foreach ($testCases as [$serverName, $domain]) { */
/*     $dnsRecord = createDnsRecord($serverName, $domain); */
/*     echo "Server: $serverName, Domain: $domain\n"; */
/*     echo "DNS Record: $dnsRecord\n"; */
/*     echo "Subdomain Hierarchy: '" . getDnsSubdomainHierarchy($domain) . "'\n"; */
/*     echo str_repeat('-', 50) . "\n"; */
/* } */
