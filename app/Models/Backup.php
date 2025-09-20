<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $server_id
 * @property string $uuid
 * @property bool $is_successful
 * @property bool $is_locked
 * @property string $name
 * @property string[] $ignored_files
 * @property array|null $server_state
 * @property string $disk
 * @property string|null $checksum
 * @property int $bytes
 * @property string|null $upload_id
 * @property string|null $snapshot_id
 * @property \Carbon\CarbonImmutable|null $completed_at
 * @property \Carbon\CarbonImmutable $created_at
 * @property \Carbon\CarbonImmutable $updated_at
 * @property \Carbon\CarbonImmutable|null $deleted_at
 * @property Server $server
 * @property \Pterodactyl\Models\AuditLog[] $audits
 */
class Backup extends Model
{
    /** @use HasFactory<\Database\Factories\BackupFactory> */
    use HasFactory;
    use SoftDeletes;

    public const RESOURCE_NAME = 'backup';

    public const ADAPTER_WINGS = 'wings';
    public const ADAPTER_AWS_S3 = 's3';
    public const ADAPTER_RUSTIC_LOCAL = 'rustic_local';
    public const ADAPTER_RUSTIC_S3 = 'rustic_s3';

    protected $table = 'backups';

    protected bool $immutableDates = true;

    protected $casts = [
        'id' => 'int',
        'is_successful' => 'bool',
        'is_locked' => 'bool',
        'ignored_files' => 'array',
        'server_state' => 'array',
        'bytes' => 'int',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'is_successful' => false,
        'is_locked' => false,
        'checksum' => null,
        'bytes' => 0,
        'upload_id' => null,
        'snapshot_id' => null,
    ];

    protected $guarded = ['id', 'created_at', 'updated_at', 'deleted_at'];

    /**
     * Check if this backup uses the rustic backup system.
     */
    public function isRustic(): bool
    {
        return in_array($this->disk, [self::ADAPTER_RUSTIC_LOCAL, self::ADAPTER_RUSTIC_S3]);
    }

    /**
     * Check if this backup is stored locally (not in cloud storage).
     */
    public function isLocal(): bool
    {
        return in_array($this->disk, [self::ADAPTER_WINGS, self::ADAPTER_RUSTIC_LOCAL]);
    }

    /**
     * Get the repository type for rustic backups.
     */
    public function getRepositoryType(): ?string
    {
        return match($this->disk) {
            self::ADAPTER_RUSTIC_LOCAL => 'local',
            self::ADAPTER_RUSTIC_S3 => 's3',
            default => null,
        };
    }

    /**
     * Check if this backup has a rustic snapshot ID.
     */
    public function hasSnapshotId(): bool
    {
        return !empty($this->snapshot_id);
    }

    public static array $validationRules = [
        'server_id' => 'bail|required|numeric|exists:servers,id',
        'uuid' => 'required|uuid',
        'is_successful' => 'boolean',
        'is_locked' => 'boolean',
        'name' => 'required|string',
        'ignored_files' => 'array',
        'server_state' => 'nullable|array',
        'disk' => 'required|string|in:wings,s3,rustic_local,rustic_s3',
        'checksum' => 'nullable|string',
        'snapshot_id' => 'nullable|string|max:64',
        'bytes' => 'numeric',
        'upload_id' => 'nullable|string',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
