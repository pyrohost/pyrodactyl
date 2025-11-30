<?php

namespace Pterodactyl\Services\Dns\Providers;

use Aws\Route53\Route53Client;
use Aws\Exception\AwsException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Illuminate\Support\Facades\Log;

class Route53Provider implements DnsProviderInterface
{
    private Route53Client $client;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        if (!empty($config['access_key_id']) && !empty($config['secret_access_key'])) {
            $this->client = new Route53Client([
                'version' => 'latest',
                'region' => $config['region'] ?? 'us-east-1',
                'credentials' => [
                    'key' => $config['access_key_id'],
                    'secret' => $config['secret_access_key'],
                ],
            ]);
        }
    }

    /**
     * Test the connection to Route53 API.
     */
    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('route53', 'access_key_id or secret_access_key');
        }

        try {
            $this->client->listHostedZones(['MaxItems' => '1']);
            return true;
        } catch (AwsException $e) {
            throw DnsProviderException::connectionFailed('route53', $e->getAwsErrorMessage());
        }
    }

    /**
     * Create a DNS record.
     */
    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $zoneId = $this->getZoneId($domain);

        try {
            Log::info('Creating Route53 record\n', [
                'domain\n' => $domain,
                'name\n' => $name,
                'type\n' => $type,
                'content\n' => $content,
                'zone_id\n' => $zoneId
            ]);

            if (strtoupper($type) === 'SRV' && is_array($content)) {
                $recordValue = sprintf(
                    '%d %d %d %s',
                    $content['priority'] ?? 0,
                    $content['weight'] ?? 5,
                    $content['port'] ?? 25565,
                    $content['target'] ?? $name . '.' . $domain
                );
            } else {
                // For other record types (A, CNAME, etc.), use content as is
                $recordValue = $content;
            }

            $params = [
                'HostedZoneId' => $zoneId,
                'ChangeBatch' => [
                    'Changes' => [
                        [
                            'Action' => 'CREATE',
                            'ResourceRecordSet' => [
                                'Name' => $name . "." . $domain,
                                'Type' => strtoupper($type),
                                'TTL' => $ttl,
                                'ResourceRecords' => [
                                    ['Value' => $recordValue]
                                ]
                            ]
                        ]
                    ]
                ]
            ];

            Log::debug('Route53 API request params', $params);

            $result = $this->client->changeResourceRecordSets($params);

            $changeId = $result->get('ChangeInfo')['Id'];
            Log::info('Route53 record created successfully', ['change_id' => $changeId]);

            /* return $changeId; */
            return $name . "." . $domain;
        } catch (AwsException $e) {
            Log::error('Route53 API error', [
                'error' => $e->getAwsErrorMessage(),
                'code' => $e->getAwsErrorCode(),
                'request_id' => $e->getAwsRequestId(),
                'domain' => $domain,
                'name' => $name
            ]);
            throw DnsProviderException::recordCreationFailed($domain, $name, $e->getAwsErrorMessage());
        } catch (\Exception $e) {
            Log::error('Unexpected error in Route53', [
                'error' => $e->getMessage(),
                'domain' => $domain,
                'name' => $name
            ]);
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
            $record = $this->getRecordById($zoneId, $recordId);

            $params = [
                'HostedZoneId' => $zoneId,
                'ChangeBatch' => [
                    'Changes' => [
                        [
                            'Action' => 'DELETE',
                            'ResourceRecordSet' => $record
                        ],
                        [
                            'Action' => 'CREATE',
                            'ResourceRecordSet' => array_merge($record, [
                                'ResourceRecords' => [['Value' => $content]],
                                'TTL' => $ttl ?? $record['TTL']
                            ])
                        ]
                    ]
                ]
            ];

            $this->client->changeResourceRecordSets($params);
            return true;
        } catch (AwsException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, $recordId, $e->getAwsErrorMessage());
        }
    }

    /**
     * Delete a DNS record.
     */
    public function deleteRecord(string $domain, string $recordName): void
    {
        $zoneId = $this->getZoneId($domain);
        $record = $this->getRecordById($zoneId, $recordName);

        if (!$record) {
            Log::info("DNS record already deleted or never existed: {$recordName}");
            return;
        }

        $rrset = ['Name' => $record['Name'], 'Type' => $record['Type']];

        if (isset($record['ResourceRecords'])) {
            $rrset['TTL'] = $record['TTL'];
            $rrset['ResourceRecords'] = $record['ResourceRecords'];
        }
        if (isset($record['AliasTarget'])) {
            $rrset['AliasTarget'] = $record['AliasTarget'];
        }

        $this->client->changeResourceRecordSets([
            'HostedZoneId' => $zoneId,
            'ChangeBatch'  => [
                'Comment' => 'Delete subdomain record - Pyrodactyl',
                'Changes'  => [[
                    'Action'            => 'DELETE',
                    'ResourceRecordSet' => $rrset,
                ]],
            ],
        ]);

        Log::info("Successfully deleted DNS record: {$recordName}");
    }



    /**
     * Get a specific DNS record.
     */
    public function getRecord(string $domain, string $recordId): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            return $this->getRecordById($zoneId, $recordId);
        } catch (AwsException $e) {
            throw DnsProviderException::connectionFailed('route53', $e->getAwsErrorMessage());
        }
    }

    /**
     * List existing DNS records for a domain.
     */
    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $zoneId = $this->getZoneId($domain);

        try {
            $params = ['HostedZoneId' => $zoneId];

            if ($name) {
                $params['StartRecordName'] = $name;
            }
            if ($type) {
                $params['StartRecordType'] = strtoupper($type);
            }

            $result = $this->client->listResourceRecordSets($params);
            return $result->get('ResourceRecordSets');
        } catch (AwsException $e) {
            throw DnsProviderException::connectionFailed('route53', $e->getAwsErrorMessage());
        }
    }

    /**
     * Get the configuration schema for Route53.
     */
    public function getConfigurationSchema(): array
    {
        return [
            'access_key_id' => [
                'type' => 'string',
                'required' => true,
                'description' => 'AWS Access Key ID with Route53 permissions',
                'sensitive' => true,
            ],
            'secret_access_key' => [
                'type' => 'string',
                'required' => true,
                'description' => 'AWS Secret Access Key',
                'sensitive' => true,
            ],
            'hosted_zone_id' => [
                'type' => 'string',
                'required' => true,
                'description' => 'Route53 Hosted Zone ID',
                'sensitive' => false,
            ],
            'region' => [
                'type' => 'string',
                'required' => false,
                'description' => 'AWS Region (default: us-east-1)',
                'default' => 'us-east-1',
                'sensitive' => false,
            ],
        ];
    }

    /**
     * Validate the provider configuration.
     */
    public function validateConfiguration(array $config): bool
    {
        if (empty($config['access_key_id']) || empty($config['secret_access_key'])) {
            throw DnsProviderException::invalidConfiguration('route53', 'access_key_id or secret_access_key');
        }

        return true;
    }

    /**
     * Get the supported record types for Route53.
     */
    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR', 'CAA', 'SOA'];
    }

    /**
     * Get the zone ID for a domain.
     */
    private function getZoneId(string $domain): string
    {
        if (!empty($this->config['hosted_zone_id'])) {
            return $this->config['hosted_zone_id'];
        }

        try {
            $result = $this->client->listHostedZones();
            $zones = $result->get('HostedZones');

            foreach ($zones as $zone) {
                if ($zone['Name'] === $domain . '.' || str_ends_with($domain, $zone['Name'])) {
                    return $zone['Id'];
                }
            }

            throw new \Exception("Domain zone not found for: $domain");
        } catch (AwsException $e) {
            throw DnsProviderException::connectionFailed('route53', $e->getAwsErrorMessage());
        }
    }

    /**
     * Get a record by ID from a zone.
     */
    private function getRecordById(string $zoneId, string $recordName): ?array
    {
        $recordName = strtolower(rtrim($recordName, '.') . '.');

        $paginator = $this->client->getPaginator('ListResourceRecordSets', [
            'HostedZoneId' => $zoneId,
        ]);

        foreach ($paginator as $page) {
            foreach ($page['ResourceRecordSets'] as $record) {
                if ($record['Name'] === $recordName) {
                    return $record;
                }
            }
        }

        return null;
    }


    /**
     * Format SRV record content for Route53.
     */
    private function formatSrvRecord(array $content): string
    {
        $priority = $content['priority'] ?? 10;
        $weight = $content['weight'] ?? 5;
        $port = $content['port'] ?? 25565;
        $target = $content['target'] ?? '';

        return "{$priority} {$weight} {$port} {$target}";
    }
}
