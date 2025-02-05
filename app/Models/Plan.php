<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'cpu',
        'memory',
        'disk',
        'servers',
        'allocations',
        'backups',
        'databases',
        'image',
        'billing_cycles',
        'renewable',
        'platform',
        'product_content',
        'invisible',
        'amount_allowed_per_customer',
        'isTrial',
        'expiresIn',
        'purchases'
    ];

    protected $casts = [
        'cpu' => 'float',
        'memory' => 'integer',
        'disk' => 'integer',
        'servers' => 'integer',
        'allocations' => 'integer',
        'backups' => 'integer',
        'databases' => 'integer',
        'price' => 'float',
        'billing_cycles' => 'array',
        'product_content' => 'array',
        'renewable' => 'boolean',
        'invisible' => 'boolean'
    ];

    protected $attributes = [
        'price' => 0,
        'cpu' => 0,
        'memory' => 0,
        'disk' => 0,
        'servers' => 0,
        'allocations' => 0,
        'backups' => 0,
        'databases' => 0,
        'renewable' => false,
        'invisible' => false,
        'billing_cycles' => '[]',
        'product_content' => '[]'
    ];
}