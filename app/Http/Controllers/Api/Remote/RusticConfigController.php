<?php

namespace Pterodactyl\Http\Controllers\Api\Remote;

use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;

class RusticConfigController extends Controller
{
    /**
     * Get rustic configuration for a server.
     * This endpoint is called by Wings to get the rustic backup configuration.
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        $server = Server::where('uuid', $uuid)->firstOrFail();

        $type = $request->query('type', 'local');

        if (!in_array($type, ['local', 's3'])) {
            return response()->json(['error' => 'Invalid backup type'], 400);
        }

        $config = [
            'backup_type' => $type,
            'repository_password' => $this->getRepositoryPassword($server),
        ];

        if ($type === 's3') {
            $s3Credentials = $this->getS3Credentials($server);
            if (!$s3Credentials) {
                return response()->json(['error' => 'S3 credentials not configured for this server'], 400);
            }
            $config['s3_credentials'] = $s3Credentials;
        }

        return response()->json($config);
    }

    /**
     * Generate server-specific repository password.
     * This password is derived from the server UUID and application key for consistency.
     */
    private function getRepositoryPassword(Server $server): string
    {
        // Use a deterministic approach: hash server UUID with app key
        // This ensures the same password is generated each time for the same server
        return hash('sha256', $server->uuid . config('app.key'));
    }

    /**
     * Get S3 credentials for rustic S3 backups from global configuration.
     */
    private function getS3Credentials(Server $server): ?array
    {
        $config = config('backups.disks.rustic_s3');

        if (empty($config['bucket'])) {
            return null;
        }

        return [
            'access_key_id' => $config['key'] ?? '',
            'secret_access_key' => $config['secret'] ?? '',
            'session_token' => '', // Not typically used for rustic
            'region' => $config['region'] ?? 'us-east-1',
            'bucket' => $config['bucket'],
            'key_prefix' => $config['prefix'] ?? "backups/{$server->uuid}/",
            'endpoint' => $config['endpoint'] ?? '',
            'force_path_style' => $config['force_path_style'] ?? false,
            'disable_ssl' => $config['disable_ssl'] ?? false,
            'ca_cert_path' => $config['ca_cert_path'] ?? '',
        ];
    }
}