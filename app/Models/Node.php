<?php

namespace Pterodactyl\Models;

use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;
use Illuminate\Container\Container;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * @property int $id
 * @property string $uuid
 * @property bool $public
 * @property bool $trust_alias
 * @property string $name
 * @property string|null $description
 * @property int $location_id
 * @property string $fqdn
 * @property string|null $internal_fqdn
 * @property bool $use_separate_fqdns
 * @property string $scheme
 * @property bool $behind_proxy
 * @property bool $maintenance_mode
 * @property int $memory
 * @property int $memory_overallocate
 * @property int $disk
 * @property int $disk_overallocate
 * @property int $upload_size
 * @property string $daemon_token_id
 * @property string $daemon_token
 * @property int $daemonListen
 * @property int $daemonSFTP
 * @property string $daemonBase
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Location $location
 * @property \Pterodactyl\Models\Mount[]|\Illuminate\Database\Eloquent\Collection $mounts
 * @property \Pterodactyl\Models\Server[]|\Illuminate\Database\Eloquent\Collection $servers
 * @property \Pterodactyl\Models\Allocation[]|\Illuminate\Database\Eloquent\Collection $allocations
 */
class Node extends Model
{
    /** @use HasFactory<\Database\Factories\NodeFactory> */
    use HasFactory;
    use Notifiable;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'node';

    public const DAEMON_TOKEN_ID_LENGTH = 16;
    public const DAEMON_TOKEN_LENGTH = 64;

    /**
     * The table associated with the model.
     */
    protected $table = 'nodes';

    /**
     * The attributes excluded from the model's JSON form.
     */
    protected $hidden = ['daemon_token_id', 'daemon_token'];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'location_id' => 'integer',
        'memory' => 'integer',
        'disk' => 'integer',
        'daemonListen' => 'integer',
        'daemonSFTP' => 'integer',
        'behind_proxy' => 'boolean',
        'public' => 'boolean',
        'trust_alias' => 'boolean',
        'maintenance_mode' => 'boolean',
        'use_separate_fqdns' => 'boolean',
    ];

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'public',
        'trust_alias',
        'name',
        'location_id',
        'fqdn',
        'internal_fqdn',
        'use_separate_fqdns',
        'scheme',
        'behind_proxy',
        'memory',
        'memory_overallocate',
        'disk',
        'disk_overallocate',
        'upload_size',
        'daemonBase',
        'daemonSFTP',
        'daemonListen',
        'daemon_token_id',
        'daemon_token',
        'description',
        'maintenance_mode',
    ];

    public static array $validationRules = [
        'name' => 'required|regex:/^([\w .-]{1,100})$/',
        'description' => 'string|nullable',
        'location_id' => 'required|exists:locations,id',
        'public' => 'boolean',
        'trust_alias' => 'boolean',
        'fqdn' => 'required|string',
        'internal_fqdn' => 'nullable|string',
        'use_separate_fqdns' => 'sometimes|boolean',
        'scheme' => 'required',
        'behind_proxy' => 'boolean',
        'memory' => 'required|numeric|min:1',
        'memory_overallocate' => 'required|numeric|min:-1',
        'disk' => 'required|numeric|min:1',
        'disk_overallocate' => 'required|numeric|min:-1',
        'daemonBase' => 'sometimes|required|regex:/^([\/][\d\w.\-\/]+)$/',
        'daemonSFTP' => 'required|numeric|between:1,65535',
        'daemonListen' => 'required|numeric|between:1,65535',
        'maintenance_mode' => 'boolean',
        'upload_size' => 'int|between:1,1024',
    ];

    /**
     * Default values for specific columns that are generally not changed on base installs.
     */
    protected $attributes = [
        'public' => true,
        'trust_alias' => false,
        'behind_proxy' => false,
        'memory_overallocate' => 0,
        'disk_overallocate' => 0,
        'daemonBase' => '/var/lib/pterodactyl/volumes',
        'daemonSFTP' => 2022,
        'daemonListen' => 8080,
        'maintenance_mode' => false,
        'use_separate_fqdns' => false,
    ];

    /**
     * Get the connection address to use when making calls to this node.
     * This will use the internal FQDN if separate FQDNs are enabled and internal_fqdn is set,
     * otherwise it will fall back to the regular fqdn.
     */
    public function getConnectionAddress(): string
    {
        $fqdn = $this->getInternalFqdn();
        return sprintf('%s://%s:%s', $this->scheme, $fqdn, $this->daemonListen);
    }

    /**
     * Get the browser connection address for WebSocket connections.
     * This always uses the public fqdn field.
     */
    public function getBrowserConnectionAddress(): string
    {
        return sprintf('%s://%s:%s', $this->scheme, $this->fqdn, $this->daemonListen);
    }

    /**
     * Get the appropriate FQDN for internal panel-to-Wings communication.
     */
    public function getInternalFqdn(): string
    {
        // Use internal FQDN if it's provided and not empty
        if (!empty($this->internal_fqdn)) {
            return $this->internal_fqdn;
        }

        return $this->fqdn;
    }

    /**
     * Returns the configuration as an array.
     */
    public function getConfiguration(): array
    {
        return [
            'debug' => false,
            'uuid' => $this->uuid,
            'token_id' => $this->daemon_token_id,
            'token' => Container::getInstance()->make(Encrypter::class)->decrypt($this->daemon_token),
            'api' => [
                'host' => '0.0.0.0',
                'port' => $this->daemonListen,
                'ssl' => [
                    'enabled' => (!$this->behind_proxy && $this->scheme === 'https'),
                    'cert' => '/etc/letsencrypt/live/' . Str::lower($this->getInternalFqdn()) . '/fullchain.pem',
                    'key' => '/etc/letsencrypt/live/' . Str::lower($this->getInternalFqdn()) . '/privkey.pem',
                ],
                'upload_limit' => $this->upload_size,
            ],
            'system' => [
                'data' => $this->daemonBase,
                'sftp' => [
                    'bind_port' => $this->daemonSFTP,
                ],
                'backups' => [
                    'rustic' => $this->getRusticBackupConfiguration(),
                ],
            ],
            'allowed_mounts' => $this->mounts->pluck('source')->toArray(),
            'remote' => route('index'),
        ];
    }

    /**
     * Get rustic backup configuration for Wings.
     * Matches the exact structure expected by elytra rustic implementation.
     */
    private function getRusticBackupConfiguration(): array
    {
        $localConfig = config('backups.disks.rustic_local', []);
        $s3Config = config('backups.disks.rustic_s3', []);

        return [
            // Path to rustic binary
            'binary_path' => $localConfig['binary_path'] ?? 'rustic',

            // Repository version (optional, default handled by rustic)
            'repository_version' => $localConfig['repository_version'] ?? 2,

            // Pack size configuration for performance tuning
            'tree_pack_size_mb' => $localConfig['tree_pack_size_mb'] ?? 4,
            'data_pack_size_mb' => $localConfig['data_pack_size_mb'] ?? 32,

            // Local repository configuration
            'local' => [
                'enabled' => !empty($localConfig),
                'repository_path' => $localConfig['repository_path'] ?? '/var/lib/pterodactyl/rustic-repos',
                'use_cold_storage' => $localConfig['use_cold_storage'] ?? false,
                'hot_repository_path' => $localConfig['hot_repository_path'] ?? '',
            ],

            // S3 repository configuration
            's3' => [
                'enabled' => !empty($s3Config['bucket']),
                'endpoint' => $s3Config['endpoint'] ?? '',
                'region' => $s3Config['region'] ?? 'us-east-1',
                'bucket' => $s3Config['bucket'] ?? '',
                'key_prefix' => $s3Config['prefix'] ?? 'pterodactyl-backups/',
                'use_cold_storage' => $s3Config['use_cold_storage'] ?? false,
                'hot_bucket' => $s3Config['hot_bucket'] ?? '',
                'cold_storage_class' => $s3Config['cold_storage_class'] ?? 'GLACIER',
                'force_path_style' => $s3Config['force_path_style'] ?? false,
                'disable_ssl' => $s3Config['disable_ssl'] ?? false,
                'ca_cert_path' => $s3Config['ca_cert_path'] ?? '',
            ],
        ];
    }

    /**
     * Returns the configuration in Yaml format.
     */
    public function getYamlConfiguration(): string
    {
        return Yaml::dump($this->getConfiguration(), 4, 2, Yaml::DUMP_EMPTY_ARRAY_AS_SEQUENCE);
    }

    /**
     * Returns the configuration in JSON format.
     */
    public function getJsonConfiguration(bool $pretty = false): string
    {
        return json_encode($this->getConfiguration(), $pretty ? JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT : JSON_UNESCAPED_SLASHES);
    }

    /**
     * Helper function to return the decrypted key for a node.
     */
    public function getDecryptedKey(): string
    {
        return (string) Container::getInstance()->make(Encrypter::class)->decrypt(
            $this->daemon_token
        );
    }

    public function isUnderMaintenance(): bool
    {
        return $this->maintenance_mode;
    }

    public function mounts(): HasManyThrough
    {
        return $this->hasManyThrough(Mount::class, MountNode::class, 'node_id', 'id', 'id', 'mount_id');
    }

    /**
     * Gets the location associated with a node.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Gets the servers associated with a node.
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }

    /**
     * Gets the allocations associated with a node.
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    /**
     * Returns a boolean if the node is viable for an additional server to be placed on it.
     */
    public function isViable(int $memory, int $disk): bool
    {
        $memoryLimit = $this->memory * (1 + ($this->memory_overallocate / 100));
        $diskLimit = $this->disk * (1 + ($this->disk_overallocate / 100));

        // Calculate used resources excluding servers marked for exclusion
        $usedMemory = $this->servers()->where('exclude_from_resource_calculation', false)->sum('memory');
        $usedDisk = $this->servers()->where('exclude_from_resource_calculation', false)->sum('disk');

        return ($usedMemory + $memory) <= $memoryLimit && ($usedDisk + $disk) <= $diskLimit;
    }
}
