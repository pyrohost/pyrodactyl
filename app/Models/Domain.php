<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $name
 * @property string $dns_provider
 * @property array $dns_config
 * @property bool $is_active
 * @property bool $is_default
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\ServerSubdomain[] $serverSubdomains
 */
class Domain extends Model
{
    /** @use HasFactory<\Database\Factories\DomainFactory> */
    use HasFactory;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'domain';

    /**
     * The table associated with the model.
     */
    protected $table = 'domains';

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'name',
        'dns_provider',
        'dns_config',
        'is_active',
        'is_default',
    ];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'dns_config' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    public static array $validationRules = [
        'name' => 'required|string|max:191|unique:domains',
        'dns_provider' => 'required|string|max:191',
        'dns_config' => 'required|array',
        'is_active' => 'sometimes|boolean',
        'is_default' => 'sometimes|boolean',
    ];

    /**
     * Gets all server subdomains associated with this domain.
     */
    public function serverSubdomains(): HasMany
    {
        return $this->hasMany(ServerSubdomain::class);
    }

    /**
     * Gets only active server subdomains associated with this domain.
     */
    public function activeSubdomains(): HasMany
    {
        return $this->hasMany(ServerSubdomain::class)->where('is_active', true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'id';
    }

    /**
     * Get the default domain for automatic subdomain generation.
     */
    public static function getDefault(): ?self
    {
        return static::where('is_active', true)
            ->where('is_default', true)
            ->first();
    }
}