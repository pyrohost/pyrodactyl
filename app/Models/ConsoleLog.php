<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class ConsoleLog extends Model
{
    protected $fillable = [
        'server_uuid',
        'content',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime'
    ];
}