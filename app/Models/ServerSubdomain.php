<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $server_id
 * @property int $domain_id
 * @property string $subdomain
 * @property string $record_type
 * @property array $dns_records
 * @property bool $is_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Server $server
 * @property Domain $domain
 */
class ServerSubdomain extends Model
{
    /** @use HasFactory<\Database\Factories\ServerSubdomainFactory> */
    use HasFactory;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'server_subdomain';

    /**
     * The table associated with the model.
     */
    protected $table = 'server_subdomains';

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'server_id',
        'domain_id',
        'subdomain',
        'record_type',
        'dns_records',
        'is_active',
    ];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'server_id' => 'integer',
        'domain_id' => 'integer',
        'dns_records' => 'array',
        'is_active' => 'boolean',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'domain_id' => 'required|integer|exists:domains,id',
        'subdomain' => 'required|string|max:191',
        'record_type' => 'required|string|max:10',
        'dns_records' => 'sometimes|array',
        'is_active' => 'sometimes|boolean',
    ];

    /**
     * Gets the server this subdomain belongs to.
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Gets the domain this subdomain uses.
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    /**
     * Get the full domain name (subdomain + domain).
     */
    public function getFullDomainAttribute(): string
    {
        return $this->subdomain . '.' . $this->domain->name;
    }

    /**
     * Check if this subdomain has DNS records configured.
     */
    public function hasDnsRecords(): bool
    {
        return !empty($this->dns_records);
    }
}