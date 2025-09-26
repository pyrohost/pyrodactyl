<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $server_id
 * @property string $uuid
 * @property string|null $job_id
 * @property string $job_status
 * @property int $job_progress
 * @property string|null $job_message
 * @property string|null $job_error
 * @property \Carbon\CarbonImmutable|null $job_started_at
 * @property \Carbon\CarbonImmutable|null $job_last_updated_at
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
 * @property \Pterodactyl\Models\BackupJobQueue[] $jobQueue
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

    // Async job statuses matching Elytra's system
    public const JOB_STATUS_PENDING = 'pending';
    public const JOB_STATUS_RUNNING = 'running';
    public const JOB_STATUS_COMPLETED = 'completed';
    public const JOB_STATUS_FAILED = 'failed';
    public const JOB_STATUS_CANCELLED = 'cancelled';

    protected $table = 'backups';

    protected bool $immutableDates = true;

    protected $casts = [
        'id' => 'int',
        'job_progress' => 'int',
        'job_started_at' => 'datetime',
        'job_last_updated_at' => 'datetime',
        'is_successful' => 'bool',
        'is_locked' => 'bool',
        'ignored_files' => 'array',
        'server_state' => 'array',
        'bytes' => 'int',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'job_status' => self::JOB_STATUS_PENDING,
        'job_progress' => 0,
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
        'job_id' => 'nullable|string|max:255',
        'job_status' => 'required|string|in:pending,running,completed,failed,cancelled',
        'job_progress' => 'integer|min:0|max:100',
        'job_message' => 'nullable|string',
        'job_error' => 'nullable|string',
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

    /**
     * Relationship to job queue entries for this backup
     */
    public function jobQueue(): HasMany
    {
        return $this->hasMany(BackupJobQueue::class);
    }

    /**
     * Check if this backup is currently in progress
     */
    public function isInProgress(): bool
    {
        return in_array($this->job_status, [
            self::JOB_STATUS_PENDING,
            self::JOB_STATUS_RUNNING
        ]);
    }

    /**
     * Check if this backup has completed successfully
     */
    public function isCompleted(): bool
    {
        return $this->job_status === self::JOB_STATUS_COMPLETED && $this->is_successful;
    }

    /**
     * Check if this backup has failed
     */
    public function hasFailed(): bool
    {
        return $this->job_status === self::JOB_STATUS_FAILED ||
               ($this->job_status === self::JOB_STATUS_COMPLETED && !$this->is_successful);
    }

    /**
     * Check if this backup has been cancelled
     */
    public function isCancelled(): bool
    {
        return $this->job_status === self::JOB_STATUS_CANCELLED;
    }

    /**
     * Check if this backup can be cancelled
     */
    public function canCancel(): bool
    {
        return $this->isInProgress() && !empty($this->job_id);
    }

    /**
     * Check if this backup can be retried
     */
    public function canRetry(): bool
    {
        return $this->hasFailed() && !empty($this->job_id);
    }

    /**
     * Update the job status and related fields
     */
    public function updateJobStatus(string $status, int $progress = null, string $message = null, string $error = null): void
    {
        $updateData = [
            'job_status' => $status,
            'job_last_updated_at' => now(),
        ];

        if ($progress !== null) {
            $updateData['job_progress'] = max(0, min(100, $progress));
        }

        if ($message !== null) {
            $updateData['job_message'] = $message;
        }

        if ($error !== null) {
            $updateData['job_error'] = $error;
        }

        // Mark as started when first moving to running
        if ($status === self::JOB_STATUS_RUNNING && $this->job_status === self::JOB_STATUS_PENDING) {
            $updateData['job_started_at'] = now();
        }

        // Update completion fields when job finishes
        if (in_array($status, [self::JOB_STATUS_COMPLETED, self::JOB_STATUS_FAILED, self::JOB_STATUS_CANCELLED])) {
            if ($status === self::JOB_STATUS_COMPLETED) {
                $updateData['is_successful'] = true;
                $updateData['completed_at'] = now();
                $updateData['job_progress'] = 100;
            } elseif ($status === self::JOB_STATUS_FAILED) {
                $updateData['is_successful'] = false;
                $updateData['completed_at'] = now();
                // Don't change lock status for failed backups
            }
        }

        $this->update($updateData);
    }

    /**
     * Get the adapter type formatted for Elytra API
     */
    public function getElytraAdapterType(): string
    {
        return match($this->disk) {
            self::ADAPTER_WINGS => 'elytra',  // Elytra uses 'elytra' for local backups
            self::ADAPTER_AWS_S3 => 's3',
            self::ADAPTER_RUSTIC_LOCAL => 'rustic_local',
            self::ADAPTER_RUSTIC_S3 => 'rustic_s3',
            default => $this->disk,
        };
    }

    /**
     * Scope to get backups that are currently in progress
     */
    public function scopeInProgress($query)
    {
        return $query->whereIn('job_status', [self::JOB_STATUS_PENDING, self::JOB_STATUS_RUNNING]);
    }

    /**
     * Scope to get completed backups
     */
    public function scopeCompleted($query)
    {
        return $query->where('job_status', self::JOB_STATUS_COMPLETED)
                    ->where('is_successful', true);
    }

    /**
     * Scope to get failed backups
     */
    public function scopeFailed($query)
    {
        return $query->where(function($q) {
            $q->where('job_status', self::JOB_STATUS_FAILED)
              ->orWhere(function($subQ) {
                  $subQ->where('job_status', self::JOB_STATUS_COMPLETED)
                       ->where('is_successful', false);
              });
        });
    }
}
