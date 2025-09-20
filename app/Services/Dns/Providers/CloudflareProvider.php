<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;

class CloudflareProvider implements DnsProviderInterface
{
    private Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        // Only initialize the client if we have an API token
        if (!empty($config['api_token'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.cloudflare.com/client/v4/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $config['api_token'],
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    /**
     * Test the connection to Cloudflare API.
     */
    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('cloudflare', 'api_token');
        }
        
        try {
            $response = $this->client->get('user/tokens/verify');
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw DnsProviderException::authenticationFailed('cloudflare');
            }
            
            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', $e->getMessage());
        }
    }

    /**
     * Create a DNS record.
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $payload = [
                'type' => strtoupper($type),
                'name' => $name,
                'ttl' => $ttl,
            ];

            // Handle different content types
            if (is_array($content)) {
                // For SRV records and other structured data
                $payload['data'] = $content;
                if (isset($content['content'])) {
                    $payload['content'] = $content['content'];
                }
            } else {
                // For simple records like A, CNAME
                $payload['content'] = $content;
            }

            $response = $this->client->post("zones/{$zoneId}/dns_records", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record creation request.');
            }

            return $data['result']['id'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $name, 'DNS service temporarily unavailable.');
        }
    }

    /**
     * Update a DNS record.
     */
    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $payload = [];

            // Handle different content types
            if (is_array($content)) {
                // For SRV records and other structured data
                $payload['data'] = $content;
                if (isset($content['content'])) {
                    $payload['content'] = $content['content'];
                }
            } else {
                // For simple records like A, CNAME
                $payload['content'] = $content;
            }

            if ($ttl !== null) {
                $payload['ttl'] = $ttl;
            }

            $response = $this->client->patch("zones/{$zoneId}/dns_records/{$recordId}", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record update request.');
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], 'DNS service temporarily unavailable.');
        }
    }

    /**
     * Delete a DNS record.
     */
    public function deleteRecord(string $domain, string $recordId): void
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $response = $this->client->delete("zones/{$zoneId}/dns_records/{$recordId}");
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw new \Exception('DNS provider rejected the record deletion request.');
            }
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordDeletionFailed($domain, [$recordId], 'DNS service temporarily unavailable.');
        }
    }

    /**
     * Get a specific DNS record.
     */
    public function getRecord(string $domain, string $recordId): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $response = $this->client->get("zones/{$zoneId}/dns_records/{$recordId}");
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw new \Exception("DNS record not found or inaccessible.");
            }

            return $data['result'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', 'DNS service temporarily unavailable.');
        }
    }

    /**
     * List existing DNS records for a domain.
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $params = [];
            if ($name) {
                $params['name'] = $name;
            }
            if ($type) {
                $params['type'] = strtoupper($type);
            }

            $response = $this->client->get("zones/{$zoneId}/dns_records", [
                'query' => $params
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            
            if (!$data['success']) {
                throw new \Exception('Failed to retrieve DNS records.');
            }

            return $data['result'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', 'DNS service temporarily unavailable.');
        }
    }

    /**
     * Get the configuration schema for Cloudflare.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'api_token' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Cloudflare API Token with Zone:Edit permissions',
                'sensitive' => true,
            ],
            'zone_id' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Cloudflare Zone ID',
                'sensitive' => false,
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_token'])) {
            throw DnsProviderException::invalidConfiguration('cloudflare', 'api_token');
        }

        return true;
    }

    /**
     * Get the supported record types for Cloudflare.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR', 'CAA'];
    }

    /**
     * Get the zone ID for a domain.
     */
    private function getZoneId(string $domain): string
    {
        // Use provided zone_id if available
        if (!empty($this->config['zone_id'])) {
            return $this->config['zone_id'];
        }

        // Fall back to auto-discovery
        try {
            $response = $this->client->get('zones', [
                'query' => ['name' => $domain]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success'] || empty($data['result'])) {
                throw new \Exception("Domain zone not found or inaccessible.");
            }

            return $data['result'][0]['id'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('cloudflare', 'DNS service temporarily unavailable.');
        }
    }
}
