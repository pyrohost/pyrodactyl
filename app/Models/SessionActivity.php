<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $ip_address
 * @property string $user_agent
 * @property array $payload
 * @property int $last_activity
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property User $user
 */
class SessionActivity extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'sessions';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'ip_address', 
        'user_agent',
        'payload',
        'last_activity',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'user_id' => 'integer',
        'payload' => 'array',
        'last_activity' => 'integer',
    ];

    /**
     * Get the user that owns this session activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}