<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 
        'description', 
        'price', 
        
        'image',
        'billingCycles', 
        'renewable', 
        'platform', 
        'productContent', 
        'invisible',
        'amountAllowedPerCustomer', 
        'purchases',
        'recurrentResources', 
        'limits', 
        'strikeThroughPrice', 
        'redir',
        'upperdesc'
    ];

    protected $casts = [
       
        'billingCycles'     => 'array',
        'productContent'    => 'array',
        'limits'            => 'array',
        'renewable'         => 'boolean',
        'invisible'         => 'boolean',
        'recurrentResources'=> 'boolean',
    ];
}