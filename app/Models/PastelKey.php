<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class PastelKey extends Model
{
    protected $table = 'pastel_keys';

    protected $fillable = [
        'user_id',
        'identifier',
        'token',
        'memo',
        'allowed_ips',
        'last_used_at',
        'expires_at',
        'r_users',
        'r_allocations',
        'r_database_hosts',
        'r_server_databases',
        'r_eggs',
        'r_locations',
        'r_nests',
        'r_nodes',
        'r_servers'
    ];

    protected $casts = [
        'allowed_ips' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    public static function generateKey(): array
    {
        return [
            'identifier' => str_random(16),
            'secret' => encrypt(str_random(32))
        ];
    }
}