<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_url',
        'type',
        'user_ids',
        'admin_only',
        'read',
        'read_at'
    ];

    protected $casts = [
        'user_ids' => 'array',
        'admin_only' => 'boolean',
        'read' => 'boolean',
        'read_at' => 'datetime'
    ];
}