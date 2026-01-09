<?php

namespace Pterodactyl\Models\Daemons;

use Illuminate\Support\Str;
use Pterodactyl\Models\Node;
use Illuminate\Container\Container;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Contracts\Daemon\Daemon;

class Wings implements Daemon
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
            ],
            'allowed_mounts' => $node->mounts->pluck('source')->toArray(),
            'remote' => route('index'),
            'allowed_origins' => [
                config('app.url'),
            ],
        ];
    }

    public function getAutoDeploy(Node $node, string $token): string
    {
        $debugFlag = config('app.debug') ? ' --allow-insecure' : '';

        return "cd /etc/pterodactyl && sudo wings configure --panel-url " . config('app.url') . " --token " . $token . " --node " . $node->id . $debugFlag . "";
    }
}
