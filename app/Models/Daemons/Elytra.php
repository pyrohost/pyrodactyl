<?php

namespace Pterodactyl\Models\Daemons;

use Illuminate\Support\Str;
use Pterodactyl\Models\Node;
use Illuminate\Container\Container;
use Illuminate\Contracts\Encryption\Encrypter;

use Pterodactyl\Contracts\Daemon\Daemon;

class Elytra implements Daemon
{
    public function getConfiguration(Node $node): array
    {
        return [
            'debug' => false,
            'uuid' => $node->uuid,
            'token_id' => $node->daemon_token_id,
            'token' => Container::getInstance()->make(Encrypter::class)->decrypt($node->daemon_token),
            'api' => [
                'host' => '0.0.0.0',
                'port' => $node->daemonListen,
                'ssl' => [
                    'enabled' => (!$node->behind_proxy && $node->scheme === 'https'),
                    'cert' => '/etc/letsencrypt/live/' . Str::lower($node->getInternalFqdn()) . '/fullchain.pem',
                    'key' => '/etc/letsencrypt/live/' . Str::lower($node->getInternalFqdn()) . '/privkey.pem',
                ],
                'upload_limit' => $node->upload_size,
            ],
            'system' => [
                'data' => $node->daemonBase,
                'sftp' => [
                    'bind_port' => $node->daemonSFTP,
                ],
                'backups' => [
                    'rustic' => $this->getBackupConfiguration(),
                ],
            ],
            'allowed_mounts' => $node->mounts->pluck('source')->toArray(),
            'remote' => route('index'),
            'allowed_origins' => [
                config('app.url'),
            ],
        ];
    }

    private function getBackupConfiguration()
    {
        $localConfig = config('backups.disks.rustic_local', []);
        $s3Config = config('backups.disks.rustic_s3', []);
        return [
            // Path to rustic binary
            'binary_path' => $localConfig['binary_path'] ?? 'rustic',

            // Repository version (optional, default handled by rustic)
            'repository_version' => $localConfig['repository_version'] ?? 2,

            // Pack size configuration for performance tuning
            'tree_pack_size_mb' => $localConfig['tree_pack_size_mb'] ?? 4,
            'data_pack_size_mb' => $localConfig['data_pack_size_mb'] ?? 32,

            // Local repository configuration
            'local' => [
                'enabled' => !empty($localConfig),
                'repository_path' => $localConfig['repository_path'] ?? '/var/lib/pterodactyl/rustic-repos',
                'use_cold_storage' => $localConfig['use_cold_storage'] ?? false,
                'hot_repository_path' => $localConfig['hot_repository_path'] ?? '',
            ],

            // S3 repository configuration
            's3' => [
                'enabled' => !empty($s3Config['bucket']),
                'endpoint' => $s3Config['endpoint'] ?? '',
                'region' => $s3Config['region'] ?? 'us-east-1',
                'bucket' => $s3Config['bucket'] ?? '',
                'use_cold_storage' => $s3Config['use_cold_storage'] ?? false,
                'hot_bucket' => $s3Config['hot_bucket'] ?? '',
                'cold_storage_class' => $s3Config['cold_storage_class'] ?? 'GLACIER',
                'force_path_style' => $s3Config['force_path_style'] ?? false,
                'disable_ssl' => $s3Config['disable_ssl'] ?? false,
                'ca_cert_path' => $s3Config['ca_cert_path'] ?? '',
            ],
        ];
    }

    public function getAutoDeploy(Node $node, string $token): string
    {
        $debugFlag = config('app.debug') ? ' --allow-insecure' : '';

        return "cd /etc/elytra && sudo elytra configure --panel-url " . config('app.url') . " --token " . $token . " --node " . $node->id . $debugFlag . "";
    }
}
