<?php

namespace Pterodactyl\Services\Dns;

use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Log;

class CloudflareDnsProvider implements DnsProviderInterface
{
    private ?Client $client = null;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
        
        if (!empty($config) && isset($config['api_token'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.cloudflare.com/client/v4/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $config['api_token'],
                    'Content-Type' => 'application/json',
                ],
            ]);
        }
    }

    public function testConnection(): bool
    {
        if (!$this->client) {
            return false;
        }
        
        try {
            $response = $this->client->get('user/tokens/verify');
            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            Log::error('Cloudflare DNS connection test failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function createSubdomainRecords(Server $server, Domain $domain): bool
    {
        try {
            if (!$this->client) {
                Log::error('Cloudflare DNS client not initialized', [
                    'server_id' => $server->id,
                    'domain' => $domain->name,
                    'config_provided' => !empty($this->config),
                    'api_token_set' => isset($this->config['api_token']) && !empty($this->config['api_token']),
                ]);
                return false;
            }

            $zoneId = $this->getZoneId($domain->name);
            if (!$zoneId) {
                Log::error('Failed to get zone ID for domain', [
                    'server_id' => $server->id,
                    'domain' => $domain->name,
                    'zone_id_in_config' => $this->config['zone_id'] ?? 'not_set',
                ]);
                return false;
            }
$records = $this->buildDnsRecords($server, $domain);

if (empty($records)) {
    Log::warning('No DNS records to create', [
        'server_id' => $server->id,
        'domain' => $domain->name,
        'subdomain' => $server->subdomain,
        'subdomain_type' => $server->subdomain_type,
        'has_subdomain_type' => !empty($server->subdomain_type),
        'server_ip' => $server->allocation->ip ?? 'null',
        'server_port' => $server->allocation->port ?? 'null',
        'allocation_id' => $server->allocation_id,
    ]);
    return false;
}

            Log::info('Creating DNS records', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'zone_id' => $zoneId,
                'record_count' => count($records),
                'records' => $records,
            ]);
            
            $createdCount = 0;
            $skippedCount = 0;
            
            foreach ($records as $record) {
                try {
                    $this->createDnsRecord($zoneId, $record);
                    $createdCount++;
                    Log::debug('Successfully created DNS record', [
                        'server_id' => $server->id,
                        'record' => $record,
                    ]);
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $response = $e->getResponse();
                    $bodyContents = $response->getBody()->getContents();
                    $body = json_decode($bodyContents, true);
                    
                    Log::error('DNS creation error details', [
                        'server_id' => $server->id,
                        'domain' => $domain->name,
                        'record' => $record,
                        'status_code' => $response->getStatusCode(),
                        'response_body' => $bodyContents,
                        'parsed_body' => $body,
                        'error_message' => $e->getMessage(),
                    ]);
                    
                    // Check if it's a duplicate record error (code 81058)
                    if ($response->getStatusCode() === 400 &&
                        isset($body['errors']) &&
                        collect($body['errors'])->contains('code', 81058)) {
                        
                        Log::info('DNS record already exists, skipping', [
                            'server_id' => $server->id,
                            'domain' => $domain->name,
                            'record' => $record,
                        ]);
                        $skippedCount++;
                        continue; // Skip this record and continue with the next one
                    }
                    
                    // Log specific error and continue with other records
                    Log::error('Failed to create DNS record, continuing with others', [
                        'server_id' => $server->id,
                        'record' => $record,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't re-throw, just continue with other records
                } catch (Exception $e) {
                    Log::error('Unexpected error creating DNS record', [
                        'server_id' => $server->id,
                        'record' => $record,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Continue with other records
                }
            }

            Log::info('DNS records processing completed', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'total_records' => count($records),
                'created' => $createdCount,
                'skipped' => $skippedCount,
            ]);

            // Consider it successful if we processed all records (created or skipped)
            return ($createdCount + $skippedCount) === count($records);
        } catch (Exception $e) {
            Log::error('Failed to create subdomain records', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    public function updateSubdomainRecords(Server $server, Domain $domain): bool
    {
        try {
            $zoneId = $this->getZoneId($domain->name);
            if (!$zoneId) {
                Log::error('Failed to get zone ID for update', [
                    'server_id' => $server->id,
                    'domain' => $domain->name,
                ]);
                return false;
            }

            // Get existing records for this subdomain (including SRV records)
            $fullDomainName = $server->subdomain . '.' . $domain->name;
            $existingRecords = $this->getAllSubdomainRecords($server->subdomain, $zoneId);
            
            // Build new records
            $newRecords = $this->buildDnsRecords($server, $domain);
            
            if (empty($newRecords)) {
                Log::warning('No new DNS records to update', [
                    'server_id' => $server->id,
                    'domain' => $domain->name,
                ]);
                return false;
            }

            Log::info('Updating DNS records', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'existing_count' => count($existingRecords),
                'new_count' => count($newRecords),
            ]);

            $updateSuccess = true;

            // Update existing records or create new ones
            foreach ($newRecords as $newRecord) {
                $existingRecord = $this->findMatchingRecord($existingRecords, $newRecord);
                
                if ($existingRecord) {
                    // Update existing record
                    try {
                        $this->updateDnsRecord($zoneId, $existingRecord['id'], $newRecord);
                        Log::debug('Updated DNS record', [
                            'record_id' => $existingRecord['id'],
                            'type' => $newRecord['type'],
                            'name' => $newRecord['name'],
                        ]);
                    } catch (Exception $e) {
                        Log::error('Failed to update DNS record', [
                            'record_id' => $existingRecord['id'],
                            'error' => $e->getMessage(),
                        ]);
                        $updateSuccess = false;
                    }
                } else {
                    // Create new record
                    try {
                        $this->createDnsRecord($zoneId, $newRecord);
                        Log::debug('Created new DNS record', [
                            'type' => $newRecord['type'],
                            'name' => $newRecord['name'],
                        ]);
                    } catch (Exception $e) {
                        Log::error('Failed to create new DNS record', [
                            'record' => $newRecord,
                            'error' => $e->getMessage(),
                        ]);
                        $updateSuccess = false;
                    }
                }
            }

            // Remove records that are no longer needed
            foreach ($existingRecords as $existingRecord) {
                if (!$this->findMatchingRecord($newRecords, $existingRecord)) {
                    try {
                        $this->deleteDnsRecord($zoneId, $existingRecord['id']);
                        Log::debug('Deleted obsolete DNS record', [
                            'record_id' => $existingRecord['id'],
                            'type' => $existingRecord['type'],
                            'name' => $existingRecord['name'],
                        ]);
                    } catch (Exception $e) {
                        Log::error('Failed to delete obsolete DNS record', [
                            'record_id' => $existingRecord['id'],
                            'error' => $e->getMessage(),
                        ]);
                        $updateSuccess = false;
                    }
                }
            }

            return $updateSuccess;
        } catch (Exception $e) {
            Log::error('Failed to update subdomain records', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    public function deleteSubdomainRecords(Server $server, Domain $domain): bool
    {
        try {
            $zoneId = $this->getZoneId($domain->name);
            if (!$zoneId) {
                return false;
            }

            $existingRecords = $this->getAllSubdomainRecords($server->subdomain, $zoneId);
            
            foreach ($existingRecords as $record) {
                $this->deleteDnsRecord($zoneId, $record['id']);
            }

            return true;
        } catch (Exception $e) {
            Log::error('Failed to delete subdomain records', [
                'server_id' => $server->id,
                'domain' => $domain->name,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    public function subdomainExists(string $subdomain, Domain $domain): bool
    {
        try {
            $zoneId = $this->getZoneId($domain->name);
            if (!$zoneId) {
                return false;
            }

            $fullDomainName = $subdomain . '.' . $domain->name;
            $records = $this->getSubdomainRecords($fullDomainName, $zoneId);
            return count($records) > 0;
        } catch (Exception $e) {
            Log::error('Failed to check subdomain existence', [
                'subdomain' => $subdomain,
                'domain' => $domain->name,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    public function getDomainRecords(Domain $domain): array
    {
        if (!$this->client) {
            return [];
        }
        
        try {
            $zoneId = $this->getZoneId($domain->name);
            if (!$zoneId) {
                return [];
            }

            $response = $this->client->get("zones/{$zoneId}/dns_records");
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['result'] ?? [];
        } catch (Exception $e) {
            Log::error('Failed to get domain records', [
                'domain' => $domain->name,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    public function validateConfig(array $config): array
    {
        $errors = [];

        if (!isset($config['api_token']) || empty($config['api_token'])) {
            $errors[] = 'API token is required';
        }

        if (!isset($config['zone_id']) || empty($config['zone_id'])) {
            $errors[] = 'Zone ID is required';
        }

        return $errors;
    }

    public function getDisplayName(): string
    {
        return 'Cloudflare';
    }

    public function getConfigFields(): array
    {
        return [
            'api_token' => [
                'label' => 'API Token',
                'type' => 'password',
                'required' => true,
                'description' => 'Cloudflare API token with Zone:Edit permissions',
            ],
            'zone_id' => [
                'label' => 'Zone ID',
                'type' => 'text',
                'required' => true,
                'description' => 'The Zone ID for your domain in Cloudflare',
            ],
        ];
    }

    private function getZoneId(string $domainName): ?string
    {
        if (!$this->client) {
            return null;
        }
        
        if (isset($this->config['zone_id']) && !empty($this->config['zone_id'])) {
            return $this->config['zone_id'];
        }

        try {
            $response = $this->client->get('zones', [
                'query' => ['name' => $domainName]
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!empty($data['result'])) {
                return $data['result'][0]['id'];
            }
        } catch (Exception $e) {
            Log::error('Failed to get zone ID', ['domain' => $domainName, 'error' => $e->getMessage()]);
        }

        return null;
    }

    private function buildDnsRecords(Server $server, Domain $domain): array
    {
        if (!$server->subdomain_type) {
            return [];
        }

        $gameRegistry = app(\Pterodactyl\Services\Games\GameRegistry::class);
        return $gameRegistry->buildDnsRecords($server->subdomain_type, $server);
    }

    private function createDnsRecord(string $zoneId, array $record): void
    {
        if (!$this->client) {
            throw new Exception('DNS client not initialized');
        }
        
        $this->client->post("zones/{$zoneId}/dns_records", [
            'json' => $record
        ]);
    }

    private function updateDnsRecord(string $zoneId, string $recordId, array $record): void
    {
        if (!$this->client) {
            throw new Exception('DNS client not initialized');
        }
        
        $this->client->put("zones/{$zoneId}/dns_records/{$recordId}", [
            'json' => $record
        ]);
    }

    private function deleteDnsRecord(string $zoneId, string $recordId): void
    {
        if (!$this->client) {
            throw new Exception('DNS client not initialized');
        }
        
        $this->client->delete("zones/{$zoneId}/dns_records/{$recordId}");
    }

    private function getSubdomainRecords(string $fullDomainName, string $zoneId): array
    {
        if (!$this->client) {
            return [];
        }
        
        $response = $this->client->get("zones/{$zoneId}/dns_records", [
            'query' => ['name' => $fullDomainName]
        ]);
        
        $data = json_decode($response->getBody()->getContents(), true);
        return $data['result'] ?? [];
    }

    private function findMatchingRecord(array $records, array $targetRecord): ?array
    {
        foreach ($records as $record) {
            if ($record['type'] === $targetRecord['type'] &&
                $record['name'] === $targetRecord['name']) {
                return $record;
            }
        }
        return null;
    }

    /**
     * Get all records for a subdomain (including different types like A and SRV).
     */
    private function getAllSubdomainRecords(string $subdomain, string $zoneId): array
    {
        if (!$this->client) {
            return [];
        }
        
        $allRecords = [];
        
        // Get A records for the subdomain
        $response = $this->client->get("zones/{$zoneId}/dns_records", [
            'query' => ['name' => $subdomain, 'type' => 'A']
        ]);
        $data = json_decode($response->getBody()->getContents(), true);
        $allRecords = array_merge($allRecords, $data['result'] ?? []);
        
        // Get SRV records for the subdomain (they have different naming pattern)
        $response = $this->client->get("zones/{$zoneId}/dns_records", [
            'query' => ['type' => 'SRV']
        ]);
        $data = json_decode($response->getBody()->getContents(), true);
        $srvRecords = $data['result'] ?? [];
        
        // Filter SRV records that belong to this subdomain
        foreach ($srvRecords as $srvRecord) {
            if (str_ends_with($srvRecord['name'], '.' . $subdomain)) {
                $allRecords[] = $srvRecord;
            }
        }
        
        return $allRecords;
    }
}