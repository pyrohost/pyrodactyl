<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;

class HetznerProvider implements DnsProviderInterface
{
    private Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        // Only initialize the client if we have an API token
        if (!empty($config['api_token'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.hetzner.cloud/v1/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $config['api_token'],
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    /**
     * Test the connection to Hetzner API.
     */
    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('hetzner', 'api_token');
        }

        try {
            $response = $this->client->get('zones');
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['zones']) {
                throw DnsProviderException::authenticationFailed('hetzner');
            }

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('hetzner', $e->getMessage());
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
                'name' => $name,
                'type' => strtoupper($type),
                'ttl' => $ttl,
                'records' => []
            ];

            if (is_array($content)) {
                // If 'content' key exists, use it and always remove the prefix before the first space ("TXT", "SRV", etc.)
                if (isset($content['content'])) {
                    $value = (string)$content['content'];
                    $spacePos = strpos($value, ' ');
                    if ($spacePos !== false) {
                        $value = substr($value, $spacePos + 1);
                    }
                } elseif (isset($content['value'])) {
                    $value = (string)$content['value'];
                    $spacePos = strpos($value, ' ');
                    if ($spacePos !== false) {
                        $value = substr($value, $spacePos + 1);
                    }
                } else {
                    $value = json_encode($content);
                }
            } else {
                $value = (string)$content;
            }
            $payload['records'][] = ['value' => $value];

            $response = $this->client->post("zones/{$zoneId}/rrsets", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if ($data['action']['error']) {
                throw new \Exception('DNS provider rejected the record creation request.');
            }

            return $data['rrset']['id'] ?? '';
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

        [$recordName, $recordType] = explode("/", $recordId);

        try {
            $payload = [
                'ttl' => $ttl,
                'records' => []
            ];

            if (is_array($content)) {
                // If 'content' key exists, use it and always remove the prefix before the first space ("TXT", "SRV", etc.)
                if (isset($content['content'])) {
                    $value = (string)$content['content'];
                    $spacePos = strpos($value, ' ');
                    if ($spacePos !== false) {
                        $value = substr($value, $spacePos + 1);
                    }
                } elseif (isset($content['value'])) {
                    $value = (string)$content['value'];
                    $spacePos = strpos($value, ' ');
                    if ($spacePos !== false) {
                        $value = substr($value, $spacePos + 1);
                    }
                } else {
                    $value = json_encode($content);
                }
            } else {
                $value = (string)$content;
            }
            $payload['records'][] = ['value' => $value];

            $response = $this->client->put("zones/{$zoneId}/rrsets/{$recordName}/{$recordType}", [
                'json' => $payload
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if ($data['action']['error']) {
                throw new \Exception('DNS provider rejected the record update request.');
            }

            return $data['rrset']['id'] ?? '';
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

        [$name, $type] = explode("/", $recordId);

        try {
            $response = $this->client->delete("zones/{$zoneId}/rrsets/{$name}/{$type}");
            $data = json_decode($response->getBody()->getContents(), true);

            if ($data['action']['error']) {
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

        [$name, $type] = explode("/", $recordId);

        try {
            $response = $this->client->get("zones/{$zoneId}/rrsets/{$name}/{$type}");
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['rrset']) {
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
            $allRecords = [];
            $page = 1;
            $perPage = 25;

            do {
                $params = [
                    'page' => $page,
                    'per_page' => $perPage,
                ];

                if ($name) {
                    $params['name'] = $name;
                }

                if ($type) {
                    $params['type'] = $type;
                }

                $response = $this->client->get('zones/{$zoneId}/rrsets', [
                    'query' => $params
                ]);

                $data = json_decode($response->getBody()->getContents(), true);

                if (!isset($data['rrsets'])) {
                    throw new \Exception('Failed to retrieve DNS records.');
                }

                $allRecords = array_merge($allRecords, $data['rrsets']);

                $hasMorePages = isset($data['meta']['pagination']['next_page']) && $data['meta']['pagination']['next_page'] !== null;

                $page++;
            } while ($hasMorePages);

            return $allRecords;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('hetzner', 'DNS service temporarily unavailable.');
        }
    }

    /**
     * Get the configuration schema for Hetzner.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'api_token' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Hetzner Cloud API Token with read/write permissions',
                'sensitive' => true,
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_token'])) {
            throw DnsProviderException::invalidConfiguration('hetzner', 'api_token');
        }

        return true;
    }

    /**
     * Get the supported record types for Hetzner.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'SRV'];
    }

    /**
     * Get the zone ID for a domain.
     */
    private function getZoneId(string $domain): string
    {
        try {
            $response = $this->client->get('zones', [
                'query' => ['name' => $domain]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (empty($data['zones'])) {
                throw new \Exception("Domain zone not found or inaccessible.");
            }

            return $data['zones'][0]['id'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('hetzner', 'DNS service temporarily unavailable.');
        }
    }
}
