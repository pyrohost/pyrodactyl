<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopResources extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'value',
        'price',
        'discounted_price',
        'is_discounted',
        'is_hidden',
        'amount',
        'limit'
    ];
    
    protected $casts = [
        'value' => 'float',
        'price' => 'decimal:2',
        'discounted_price' => 'decimal:2',
        'is_discounted' => 'boolean',
        'is_hidden' => 'boolean',
        'amount' => 'integer',
        'limit' => 'integer'
    ];
}