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
 * @property \Carbon\Carbon|null $last_sync_at
 * @property array|null $sync_status
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\Server[] $servers
 */
class Domain extends Model
{
    use HasFactory;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'domain';

    /**
     * Available DNS providers
     */
    public const DNS_PROVIDER_CLOUDFLARE = 'cloudflare';

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
        'last_sync_at',
        'sync_status',
    ];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'dns_config' => 'array',
        'sync_status' => 'array',
        'last_sync_at' => 'datetime',
    ];

    /**
     * Validation rules for domain creation and updates.
     */
    public static array $validationRules = [
        'name' => 'required|string|min:3|max:253|regex:/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/',
        'dns_provider' => 'required|string|in:cloudflare',
        'dns_config' => 'required|array',
        'is_active' => 'boolean',
    ];

    /**
     * Get all servers that use this domain.
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'domain_id');
    }

    /**
     * Check if the domain supports the given DNS provider.
     */
    public function supportsProvider(string $provider): bool
    {
        return $provider === self::DNS_PROVIDER_CLOUDFLARE;
    }

    /**
     * Get the display name for the DNS provider.
     */
    public function getProviderDisplayName(): string
    {
        return match ($this->dns_provider) {
            self::DNS_PROVIDER_CLOUDFLARE => 'Cloudflare',
            default => ucfirst($this->dns_provider),
        };
    }

    /**
     * Get the full domain name with subdomain.
     */
    public function getFullDomain(string $subdomain): string
    {
        return $subdomain . '.' . $this->name;
    }

}